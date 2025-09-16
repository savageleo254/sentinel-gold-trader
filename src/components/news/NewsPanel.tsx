import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Newspaper, TrendingUp, TrendingDown, Clock, ExternalLink } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  impact: "high" | "medium" | "low";
  sentiment: "bullish" | "bearish" | "neutral";
  source: string;
  timestamp: string;
  url?: string;
}

export const NewsPanel = () => {
  const [news, setNews] = useState<NewsItem[]>([
    {
      id: "1",
      title: "Federal Reserve Hints at Rate Cut in Q2",
      summary: "Fed officials suggest potential monetary policy shifts affecting gold demand",
      impact: "high",
      sentiment: "bullish",
      source: "ForexFactory",
      timestamp: "2024-01-15T10:30:00Z",
      url: "https://www.forexfactory.com"
    },
    {
      id: "2", 
      title: "US Dollar Strengthens Against Major Currencies",
      summary: "DXY index rises 0.8% putting pressure on precious metals",
      impact: "medium",
      sentiment: "bearish",
      source: "MarketWatch",
      timestamp: "2024-01-15T09:15:00Z"
    },
    {
      id: "3",
      title: "Geopolitical Tensions Rise in Middle East",
      summary: "Safe-haven demand for gold increases amid regional uncertainty",
      impact: "high",
      sentiment: "bullish",
      source: "Reuters",
      timestamp: "2024-01-15T08:45:00Z"
    },
    {
      id: "4",
      title: "China Manufacturing PMI Beats Expectations",
      summary: "Strong economic data from China boosts industrial metals demand",
      impact: "medium",
      sentiment: "neutral",
      source: "Bloomberg",
      timestamp: "2024-01-15T07:30:00Z"
    }
  ]);

  const [activeFilter, setActiveFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="h-3 w-3 text-buy" />;
      case "bearish":
        return <TrendingDown className="h-3 w-3 text-sell" />;
      default:
        return <Clock className="h-3 w-3 text-neutral" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return "text-buy";
      case "bearish":
        return "text-sell";
      default:
        return "text-neutral";
    }
  };

  const filteredNews = activeFilter === "all" 
    ? news 
    : news.filter(item => item.impact === activeFilter);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const newsTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - newsTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-r from-primary/80 to-primary rounded-lg">
          <Newspaper className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Market News</h3>
          <p className="text-xs text-muted-foreground">Real-time sentiment analysis</p>
        </div>
      </div>

      {/* News Filters */}
      <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)}>
        <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="high" className="text-xs">High</TabsTrigger>
          <TabsTrigger value="medium" className="text-xs">Medium</TabsTrigger>
          <TabsTrigger value="low" className="text-xs">Low</TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="mt-4">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {filteredNews.map((item) => (
              <div key={item.id} className="p-3 bg-secondary/10 rounded-lg border border-border hover:bg-secondary/20 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={getImpactColor(item.impact)} className="text-xs">
                      {item.impact.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getSentimentIcon(item.sentiment)}
                      <span className={`text-xs font-medium ${getSentimentColor(item.sentiment)}`}>
                        {item.sentiment.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimeAgo(item.timestamp)}
                  </div>
                </div>

                <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-2">
                  {item.title}
                </h4>
                
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {item.summary}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Source: {item.source}
                  </span>
                  {item.url && (
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* News Summary */}
      <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
        <h4 className="text-sm font-semibold text-foreground mb-2">Market Sentiment</h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <p className="text-buy font-medium">
              {news.filter(n => n.sentiment === "bullish").length}
            </p>
            <p className="text-muted-foreground">Bullish</p>
          </div>
          <div className="text-center">
            <p className="text-sell font-medium">
              {news.filter(n => n.sentiment === "bearish").length}
            </p>
            <p className="text-muted-foreground">Bearish</p>
          </div>
          <div className="text-center">
            <p className="text-neutral font-medium">
              {news.filter(n => n.sentiment === "neutral").length}
            </p>
            <p className="text-muted-foreground">Neutral</p>
          </div>
        </div>
      </div>
    </Card>
  );
};