-- Create news_events table for storing scraped news
CREATE TABLE public.news_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  source TEXT NOT NULL,
  impact TEXT NOT NULL DEFAULT 'LOW',
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  url TEXT,
  category TEXT,
  symbols TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news_analysis table for AI sentiment analysis
CREATE TABLE public.news_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  news_count INTEGER NOT NULL DEFAULT 0,
  sentiment_score NUMERIC,
  market_direction TEXT,
  confidence NUMERIC,
  key_factors JSONB,
  source_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for news_events
CREATE POLICY "News events are viewable by everyone" 
ON public.news_events 
FOR SELECT 
USING (true);

-- Create policies for news_analysis
CREATE POLICY "News analysis is viewable by everyone" 
ON public.news_analysis 
FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_news_events_published_at ON public.news_events(published_at DESC);
CREATE INDEX idx_news_events_impact ON public.news_events(impact);
CREATE INDEX idx_news_events_symbols ON public.news_events USING GIN(symbols);
CREATE INDEX idx_news_analysis_time ON public.news_analysis(analysis_time DESC);

-- Create unique constraint to prevent duplicate news
ALTER TABLE public.news_events ADD CONSTRAINT unique_news_title_source UNIQUE (title, source);