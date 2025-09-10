import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Node } from 'reactflow';

interface WorkflowNodeEditorProps {
  selectedNode: Node | null;
  onNodeChange: (node: Node) => void;
}

const WorkflowNodeEditor: React.FC<WorkflowNodeEditorProps> = ({ selectedNode, onNodeChange }) => {
  if (!selectedNode) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a node to see its properties.</p>
        </CardContent>
      </Card>
    );
  }

  const { data, type } = selectedNode;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    const newData = { ...data, [name]: value };
    onNodeChange({ ...selectedNode, data: newData });
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Edit {type} Node</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={data.name || ''}
            onChange={handleInputChange}
          />
        </div>
        
        {type === 'agent' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                name="role"
                value={data.role || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Textarea
                id="goal"
                name="goal"
                value={data.goal || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backstory">Backstory</Label>
              <Textarea
                id="backstory"
                name="backstory"
                value={data.backstory || ''}
                onChange={handleInputChange}
              />
            </div>
          </>
        )}

        {type === 'task' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={data.description || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_output">Expected Output</Label>
              <Textarea
                id="expected_output"
                name="expected_output"
                value={data.expected_output || ''}
                onChange={handleInputChange}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowNodeEditor;
