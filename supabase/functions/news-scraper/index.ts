import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting news scraping process...');
    
    // Scrape multiple news sources
    const newsSources = [
      { name: 'ForexFactory', url: 'https://www.forexfactory.com/calendar', scraper: scrapeForexFactory },
      { name: 'Investing', url: 'https://www.investing.com/news/forex-news', scraper: scrapeInvesting },
      { name: 'DailyFX', url: 'https://www.dailyfx.com/news', scraper: scrapeDailyFX }
    ];

    let totalNews = 0;
    const scrapedNews = [];

    for (const source of newsSources) {
      try {
        console.log(`Scraping ${source.name}...`);
        const newsItems = await source.scraper(source.url);
        scrapedNews.push(...newsItems);
        totalNews += newsItems.length;
        
        // Store news in database
        if (newsItems.length > 0) {
          const { error } = await supabase
            .from('news_events')
            .upsert(newsItems, { 
              onConflict: 'title,source',
              ignoreDuplicates: true 
            });
            
          if (error) {
            console.error(`Error storing ${source.name} news:`, error);
          }
        }
        
        // Rate limiting between sources
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);
      }
    }

    // Analyze news sentiment and impact
    await analyzeNewsImpact(scrapedNews);

    return new Response(JSON.stringify({
      status: 'applied',
      patch: `News scraping completed: ${totalNews} articles`,
      checks: {
        sources_scraped: newsSources.length,
        total_articles: totalNews,
        high_impact_events: scrapedNews.filter(n => n.impact === 'HIGH').length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('News scraping error:', error);
    return new Response(JSON.stringify({
      status: 'rejected',
      reason: error.message,
      guidance: ['Check network connectivity', 'Verify scraping targets', 'Review rate limits']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function scrapeForexFactory(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    const newsItems = [];
    const calendarRows = doc.querySelectorAll('.calendar__row');
    
    for (const row of calendarRows) {
      try {
        const timeElement = row.querySelector('.calendar__time');
        const currencyElement = row.querySelector('.calendar__currency');
        const eventElement = row.querySelector('.calendar__event');
        const impactElement = row.querySelector('.calendar__impact');
        
        if (eventElement && currencyElement) {
          const title = eventElement.textContent?.trim();
          const currency = currencyElement.textContent?.trim();
          const time = timeElement?.textContent?.trim();
          const impactSpans = impactElement?.querySelectorAll('.calendar__impact-icon--screen');
          const impact = impactSpans?.length >= 3 ? 'HIGH' : impactSpans?.length >= 2 ? 'MEDIUM' : 'LOW';
          
          if (title && (currency === 'USD' || title.toLowerCase().includes('gold'))) {
            newsItems.push({
              title: `[${currency}] ${title}`,
              content: `Forex Factory Calendar Event - ${title}`,
              source: 'ForexFactory',
              impact,
              published_at: new Date().toISOString(),
              url: 'https://www.forexfactory.com/calendar',
              category: 'ECONOMIC_CALENDAR',
              symbols: currency === 'USD' ? ['XAUUSD', 'EURUSD', 'GBPUSD'] : ['XAUUSD']
            });
          }
        }
      } catch (rowError) {
        console.error('Error processing calendar row:', rowError);
      }
    }
    
    return newsItems.slice(0, 20); // Limit to 20 most recent
  } catch (error) {
    console.error('ForexFactory scraping error:', error);
    return [];
  }
}

async function scrapeInvesting(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    const newsItems = [];
    const articles = doc.querySelectorAll('.largeTitle');
    
    for (const article of articles.slice(0, 15)) {
      try {
        const titleElement = article.querySelector('a');
        const title = titleElement?.textContent?.trim();
        const link = titleElement?.getAttribute('href');
        
        if (title && (title.toLowerCase().includes('gold') || 
                     title.toLowerCase().includes('usd') ||
                     title.toLowerCase().includes('fed') ||
                     title.toLowerCase().includes('inflation'))) {
          
          newsItems.push({
            title: title.substring(0, 200),
            content: `Investing.com News: ${title}`,
            source: 'Investing.com',
            impact: determineImpactFromTitle(title),
            published_at: new Date().toISOString(),
            url: link ? `https://www.investing.com${link}` : url,
            category: 'MARKET_NEWS',
            symbols: ['XAUUSD']
          });
        }
      } catch (articleError) {
        console.error('Error processing investing article:', articleError);
      }
    }
    
    return newsItems;
  } catch (error) {
    console.error('Investing.com scraping error:', error);
    return [];
  }
}

async function scrapeDailyFX(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    const newsItems = [];
    const articles = doc.querySelectorAll('.dfx-article');
    
    for (const article of articles.slice(0, 10)) {
      try {
        const titleElement = article.querySelector('h3 a, h2 a');
        const title = titleElement?.textContent?.trim();
        const link = titleElement?.getAttribute('href');
        
        if (title && (title.toLowerCase().includes('gold') || 
                     title.toLowerCase().includes('xau') ||
                     title.toLowerCase().includes('precious'))) {
          
          newsItems.push({
            title: title.substring(0, 200),
            content: `DailyFX Analysis: ${title}`,
            source: 'DailyFX',
            impact: 'MEDIUM',
            published_at: new Date().toISOString(),
            url: link ? `https://www.dailyfx.com${link}` : url,
            category: 'TECHNICAL_ANALYSIS',
            symbols: ['XAUUSD']
          });
        }
      } catch (articleError) {
        console.error('Error processing DailyFX article:', articleError);
      }
    }
    
    return newsItems;
  } catch (error) {
    console.error('DailyFX scraping error:', error);
    return [];
  }
}

function determineImpactFromTitle(title: string): string {
  const highImpactKeywords = ['fed', 'interest rate', 'inflation', 'unemployment', 'gdp', 'nonfarm', 'cpi', 'ppi'];
  const mediumImpactKeywords = ['retail sales', 'consumer confidence', 'manufacturing', 'housing'];
  
  const lowerTitle = title.toLowerCase();
  
  if (highImpactKeywords.some(keyword => lowerTitle.includes(keyword))) {
    return 'HIGH';
  } else if (mediumImpactKeywords.some(keyword => lowerTitle.includes(keyword))) {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

async function analyzeNewsImpact(newsItems: any[]) {
  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) return;

    // Group news by impact level
    const highImpactNews = newsItems.filter(n => n.impact === 'HIGH');
    
    if (highImpactNews.length === 0) return;

    // Analyze sentiment using Gemini AI
    const newsText = highImpactNews.map(n => n.title).join('\n');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze the sentiment and market impact of these financial news headlines for gold (XAUUSD) trading. Return a JSON response with sentiment_score (-1 to 1), market_direction (BULLISH/BEARISH/NEUTRAL), confidence (0-1), and key_factors array:

${newsText}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (analysis) {
      try {
        const parsedAnalysis = JSON.parse(analysis);
        
        // Store news analysis
        await supabase
          .from('news_analysis')
          .insert({
            analysis_time: new Date().toISOString(),
            news_count: highImpactNews.length,
            sentiment_score: parsedAnalysis.sentiment_score,
            market_direction: parsedAnalysis.market_direction,
            confidence: parsedAnalysis.confidence,
            key_factors: parsedAnalysis.key_factors,
            source_data: highImpactNews.map(n => ({ title: n.title, source: n.source }))
          });
          
      } catch (parseError) {
        console.error('Error parsing news analysis:', parseError);
      }
    }
    
  } catch (error) {
    console.error('News impact analysis error:', error);
  }
}