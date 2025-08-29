"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Terminal, Loader } from "lucide-react";
import { useWorkflowContext } from "@/app/(main)/workflow/page";
import { ScrollArea } from "../ui/scroll-area";
import React from "react";


const badgeColors: { [key: string]: string } = {
    info: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    task: "bg-primary/20 text-primary border-primary/30",
    tool: "bg-accent/20 text-accent border-accent/30",
    error: "bg-destructive/20 text-destructive-foreground border-destructive/30"
}


export default function WorkflowExecutionEvents() {
    const { events, isExecuting } = useWorkflowContext();
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, [events]);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Terminal className="w-6 h-6" />
                    <div>
                        <CardTitle>Execution Events</CardTitle>
                        <CardDescription>A real-time stream of events from the workflow execution.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div ref={scrollAreaRef} className="h-full">
                        <Table>
                            <TableHeader className="sticky top-0 bg-card z-10">
                                <TableRow>
                                    <TableHead className="w-[120px]">Timestamp</TableHead>
                                    <TableHead className="w-[180px]">Event</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{item.timestamp}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={badgeColors[item.type]}>{item.event}</Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm whitespace-pre-wrap">{item.details}</TableCell>
                                    </TableRow>
                                ))}
                                {isExecuting && events.length > 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center">
                                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                <Loader className="w-4 h-4 animate-spin" />
                                                <span>Executing...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!isExecuting && events.length === 0 && (
                                     <TableRow>
                                     <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                         Click "Start Execution" to begin the workflow.
                                     </TableCell>
                                 </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
