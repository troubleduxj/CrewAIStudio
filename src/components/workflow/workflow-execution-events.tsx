"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Terminal } from "lucide-react";

const mockEvents = [
  { event: "Workflow Started", details: "Crew execution initialized.", timestamp: "10:30:01 AM", type: "info" },
  { event: "Task Started", details: "Agent: Data Analyst, Task: Load Sales Data", timestamp: "10:30:02 AM", type: "task" },
  { event: "Tool Called", details: "Tool: file_reader, Input: `sales_data.csv`", timestamp: "10:30:03 AM", type: "tool" },
  { event: "Tool Output", details: "Successfully read 10,000 rows from file.", timestamp: "10:30:05 AM", type: "tool" },
  { event: "Task Completed", details: "Agent: Data Analyst, Task: Load Sales Data", timestamp: "10:30:05 AM", type: "task" },
  { event: "Task Started", details: "Agent: Web Researcher, Task: Research Competitors", timestamp: "10:30:06 AM", type: "task" },
  { event: "Tool Called", details: "Tool: browser, Input: 'top E-commerce competitors 2024'", timestamp: "10:30:07 AM", type: "tool" },
];

const badgeColors: { [key: string]: string } = {
    info: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    task: "bg-primary/20 text-primary border-primary/30",
    tool: "bg-accent/20 text-accent border-accent/30"
}


export default function WorkflowExecutionEvents() {
    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Terminal className="w-6 h-6" />
                    <div>
                        <CardTitle>Execution Events</CardTitle>
                        <CardDescription>A real-time stream of events from the workflow execution.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Timestamp</TableHead>
                            <TableHead className="w-[180px]">Event</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockEvents.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-mono text-xs text-muted-foreground">{item.timestamp}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={badgeColors[item.type]}>{item.event}</Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">{item.details}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
