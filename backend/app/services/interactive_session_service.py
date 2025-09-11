import asyncio
import json
from typing import Optional

from fastapi import WebSocket
from loguru import logger

from crewai import Agent, Task, Crew
from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI

from app.services.llm_service import LLMService
from app.schemas.llm import LLMProvider


async def get_llm_instance(model_name: str):
    """
    Dynamically creates an LLM instance based on the provider's configuration.
    """
    llm_service = LLMService()
    configs = await llm_service.get_all_configs()

    target_config = None
    for config in configs:
        if config.model == model_name and config.is_active:
            target_config = config
            break

    if not target_config:
        logger.warning(
            f"No active configuration found for model {model_name}. Falling back to default."
        )
        # Fallback to a default, non-provider-specific configuration
        return ChatOpenAI(model_name="gpt-4", temperature=0.7, streaming=True)

    logger.info(
        f"Found active configuration for model {model_name} with provider {target_config.provider}"
    )

    provider = target_config.provider

    if provider == LLMProvider.OPENAI or provider == LLMProvider.DEEPSEEK:
        return ChatOpenAI(
            model_name=target_config.model,
            temperature=target_config.temperature,
            api_key=target_config.api_key,
            base_url=target_config.base_url,
            streaming=True,
        )
    elif provider == LLMProvider.GEMINI:
        return ChatGoogleGenerativeAI(
            model=target_config.model,
            google_api_key=target_config.api_key,
            temperature=target_config.temperature,
            streaming=True,
        )
    # Add other providers like Anthropic, Ollama here as needed
    # elif provider == LLMProvider.ANTHROPIC:
    #     ...

    else:
        logger.error(f"Unsupported LLM provider: {provider}. Falling back to default.")
        return ChatOpenAI(model_name="gpt-4", temperature=0.7, streaming=True)


async def run_simple_agent(
    user_input: str, model_name: Optional[str], websocket: WebSocket
):
    """
    Runs a simple CrewAI agent with a given task and streams the output.
    """
    effective_model_name = (
        model_name if model_name else "gemini-pro"
    )  # Default to a configured model
    logger.info(
        f"Starting simple agent with input: '{user_input}' using model: {effective_model_name}"
    )

    try:
        # 1. Setup streaming callback
        callback = AsyncIteratorCallbackHandler()

        # 2. Get LLM instance dynamically
        llm = await get_llm_instance(effective_model_name)
        llm.callbacks = [callback]  # Attach callback to the selected llm

        # 3. Define Agent and Task
        researcher = Agent(
            role="Senior Research Analyst",
            goal="Uncover cutting-edge developments in AI and data science",
            backstory="""You work at a leading tech think tank.
            Your expertise lies in identifying emerging trends.
            You have a knack for dissecting complex data and presenting
            actionable insights.""",
            verbose=True,
            allow_delegation=False,
            llm=llm,
        )

        task = Task(
            description=f"Conduct a brief research on the following topic: {user_input}",
            expected_output="A 3-4 paragraph summary of the key findings.",
            agent=researcher,
        )

        # 4. Create Crew
        crew = Crew(agents=[researcher], tasks=[task], verbose=2)

        # 5. Asynchronous kickoff and streaming
        async def kickoff_and_stream():
            # This is a blocking call, so we run it in a separate thread
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, crew.kickoff)
            # Signal the end of the main execution
            await callback.on_llm_end({"result": result})

        # Start the crew execution in a background task
        asyncio.create_task(kickoff_and_stream())

        # Stream tokens back to the client
        async for token in callback.aiter():
            message = {"type": "token", "content": token}
            await websocket.send_text(json.dumps(message))

        # Send a final message indicating completion
        final_message = {"type": "end", "content": "Agent execution finished."}
        await websocket.send_text(json.dumps(final_message))
        logger.info("Agent execution and streaming finished.")

    except Exception as e:
        logger.error(f"An error occurred during agent execution: {e}")
        error_message = {"type": "error", "content": f"Error: {e}"}
        await websocket.send_text(json.dumps(error_message))
