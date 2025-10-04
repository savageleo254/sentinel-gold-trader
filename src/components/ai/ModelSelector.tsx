import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Brain, Cpu, Zap, Settings, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AIModel {
  id: string;
  name: string;
  model_type: string;
  version: string;
  is_active: boolean;
  performance_metrics: any;
  winrate: number;
  sharpe_ratio: number;
  max_drawdown: number;
}

export const ModelSelector = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [activeModel, setActiveModel] = useState<string>("");
  const [modelPerformance, setModelPerformance] = useState({
    accuracy: 0,
    speed: 0,
    efficiency: 0,
  });

  useEffect(() => {
    const fetchModels = async () => {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setModels(data);
        const active = data.find(model => model.is_active);
        if (active) {
          setActiveModel(active.id);
          setModelPerformance({
            accuracy: (active.winrate || 0) * 100,
            speed: Math.random() * 100, // Simulated for demo
            efficiency: ((active.sharpe_ratio || 0) + 2) * 25, // Normalized
          });
        }
      }
    };

    fetchModels();
  }, []);

  const handleModelChange = async (modelId: string) => {
    setActiveModel(modelId);
    
    // Deactivate all models first
    await supabase
      .from('ai_models')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    // Activate selected model
    await supabase
      .from('ai_models')
      .update({ is_active: true })
      .eq('id', modelId);

    const selectedModel = models.find(m => m.id === modelId);
    if (selectedModel) {
      const metrics = selectedModel.performance_metrics as any;
      setModelPerformance({
        accuracy: (selectedModel.winrate || 0) * 100,
        speed: metrics?.training_accuracy ? 
               (metrics.training_accuracy * 100) : 85,
        efficiency: ((selectedModel.sharpe_ratio || 0) + 2) * 25,
      });
    }
  };

  const handleRetrain = async () => {
    if (!activeModel) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('model-trainer', {
        body: { 
          modelId: activeModel,
          symbol: 'XAUUSD',
          timeframe: '15min',
          epochs: 50 
        }
      });

      if (error) throw error;

      console.log('Model retrained successfully:', data);
      
      // Refresh models
      const { data: updatedModels } = await supabase
        .from('ai_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (updatedModels) {
        setModels(updatedModels);
        const retrainedModel = updatedModels.find(m => m.id === activeModel);
        if (retrainedModel) {
          const metrics = retrainedModel.performance_metrics as any;
          setModelPerformance({
            accuracy: (retrainedModel.winrate || 0) * 100,
            speed: metrics?.training_accuracy ?
                   (metrics.training_accuracy * 100) : 85,
            efficiency: ((retrainedModel.sharpe_ratio || 0) + 2) * 25,
          });
        }
      }
    } catch (error) {
      console.error('Retraining error:', error);
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'neural_network':
        return <Brain className="h-4 w-4" />;
      case 'ensemble':
        return <Cpu className="h-4 w-4" />;
      case 'reinforcement':
        return <Zap className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const currentModel = models.find(m => m.id === activeModel);

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-ai rounded-lg">
          <Cpu className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI Model Control</h3>
          <p className="text-xs text-muted-foreground">HRM Retraining System</p>
        </div>
      </div>

      {/* Model Selector */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Active Model
          </label>
          <Select value={activeModel} onValueChange={handleModelChange}>
            <SelectTrigger className="bg-secondary/20">
              <SelectValue placeholder="Select AI Model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    {getModelTypeIcon(model.model_type)}
                    <span>{model.name}</span>
                    <Badge variant="outline" className="text-xs">
                      v{model.version}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Model Performance */}
        {currentModel && (
          <div className="p-3 bg-secondary/20 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">{currentModel.name}</span>
              <Badge variant="default" className="gap-1">
                <Activity className="h-3 w-3" />
                ACTIVE
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Accuracy</span>
                  <span className="text-foreground">{modelPerformance.accuracy.toFixed(1)}%</span>
                </div>
                <Progress value={modelPerformance.accuracy} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Processing Speed</span>
                  <span className="text-foreground">{modelPerformance.speed.toFixed(1)}%</span>
                </div>
                <Progress value={modelPerformance.speed} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Efficiency</span>
                  <span className="text-foreground">{modelPerformance.efficiency.toFixed(1)}%</span>
                </div>
                <Progress value={modelPerformance.efficiency} className="h-2" />
              </div>
            </div>

            <Separator className="my-3" />

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="text-muted-foreground">Win Rate</p>
                <p className="font-medium text-buy">{(currentModel.winrate * 100 || 0).toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Sharpe</p>
                <p className="font-medium text-foreground">{currentModel.sharpe_ratio?.toFixed(2) || 'N/A'}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Max DD</p>
                <p className="font-medium text-sell">{currentModel.max_drawdown?.toFixed(1) || 'N/A'}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Model Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Settings className="h-3 w-3 mr-1" />
            Configure
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={handleRetrain}>
            <Zap className="h-3 w-3 mr-1" />
            Retrain
          </Button>
        </div>

        {/* HRM Status */}
        <div className="p-2 bg-warning/10 border border-warning/20 rounded text-xs">
          <div className="flex items-center gap-1 text-warning">
            <Brain className="h-3 w-3" />
            <span className="font-medium">HRM Status:</span>
          </div>
          <p className="text-muted-foreground mt-1">
            Continuous learning enabled. Model adapts based on performance feedback.
          </p>
        </div>
      </div>
    </Card>
  );
};