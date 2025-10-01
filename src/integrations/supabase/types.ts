export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_models: {
        Row: {
          created_at: string
          deployment_mode: string
          id: string
          is_active: boolean
          max_drawdown: number | null
          model_hash: string
          model_type: string
          name: string
          parameters: Json
          performance_metrics: Json | null
          sharpe_ratio: number | null
          training_data_hash: string | null
          updated_at: string
          version: string
          winrate: number | null
        }
        Insert: {
          created_at?: string
          deployment_mode?: string
          id?: string
          is_active?: boolean
          max_drawdown?: number | null
          model_hash: string
          model_type: string
          name: string
          parameters: Json
          performance_metrics?: Json | null
          sharpe_ratio?: number | null
          training_data_hash?: string | null
          updated_at?: string
          version: string
          winrate?: number | null
        }
        Update: {
          created_at?: string
          deployment_mode?: string
          id?: string
          is_active?: boolean
          max_drawdown?: number | null
          model_hash?: string
          model_type?: string
          name?: string
          parameters?: Json
          performance_metrics?: Json | null
          sharpe_ratio?: number | null
          training_data_hash?: string | null
          updated_at?: string
          version?: string
          winrate?: number | null
        }
        Relationships: []
      }
      market_data: {
        Row: {
          close_price: number
          created_at: string
          high_price: number
          id: string
          low_price: number
          open_price: number
          spread: number
          symbol: string
          tick_volume: number
          timeframe: string
          timestamp: string
          volume: number
        }
        Insert: {
          close_price: number
          created_at?: string
          high_price: number
          id?: string
          low_price: number
          open_price: number
          spread?: number
          symbol: string
          tick_volume?: number
          timeframe: string
          timestamp: string
          volume?: number
        }
        Update: {
          close_price?: number
          created_at?: string
          high_price?: number
          id?: string
          low_price?: number
          open_price?: number
          spread?: number
          symbol?: string
          tick_volume?: number
          timeframe?: string
          timestamp?: string
          volume?: number
        }
        Relationships: []
      }
      market_data_stream: {
        Row: {
          ask: number
          bid: number
          created_at: string
          id: string
          last: number
          source: string
          symbol: string
          timestamp: string
          volume: number
        }
        Insert: {
          ask: number
          bid: number
          created_at?: string
          id?: string
          last: number
          source?: string
          symbol: string
          timestamp?: string
          volume?: number
        }
        Update: {
          ask?: number
          bid?: number
          created_at?: string
          id?: string
          last?: number
          source?: string
          symbol?: string
          timestamp?: string
          volume?: number
        }
        Relationships: []
      }
      news_analysis: {
        Row: {
          analysis_time: string
          confidence: number | null
          created_at: string
          id: string
          key_factors: Json | null
          market_direction: string | null
          news_count: number
          sentiment_score: number | null
          source_data: Json | null
        }
        Insert: {
          analysis_time?: string
          confidence?: number | null
          created_at?: string
          id?: string
          key_factors?: Json | null
          market_direction?: string | null
          news_count?: number
          sentiment_score?: number | null
          source_data?: Json | null
        }
        Update: {
          analysis_time?: string
          confidence?: number | null
          created_at?: string
          id?: string
          key_factors?: Json | null
          market_direction?: string | null
          news_count?: number
          sentiment_score?: number | null
          source_data?: Json | null
        }
        Relationships: []
      }
      news_events: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          id: string
          impact: string
          published_at: string
          source: string
          symbols: string[] | null
          title: string
          url: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          impact?: string
          published_at: string
          source: string
          symbols?: string[] | null
          title: string
          url?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          impact?: string
          published_at?: string
          source?: string
          symbols?: string[] | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          average_trade: number | null
          consecutive_losses: number | null
          consecutive_wins: number | null
          created_at: string
          entity_id: string
          entity_type: string
          gross_loss: number
          gross_profit: number
          id: string
          largest_loss: number | null
          largest_win: number | null
          losing_trades: number
          max_drawdown: number | null
          max_drawdown_percent: number | null
          net_profit: number
          period_end: string
          period_start: string
          profit_factor: number | null
          sharpe_ratio: number | null
          sortino_ratio: number | null
          total_trades: number
          winning_trades: number
          winrate: number | null
        }
        Insert: {
          average_trade?: number | null
          consecutive_losses?: number | null
          consecutive_wins?: number | null
          created_at?: string
          entity_id: string
          entity_type: string
          gross_loss?: number
          gross_profit?: number
          id?: string
          largest_loss?: number | null
          largest_win?: number | null
          losing_trades?: number
          max_drawdown?: number | null
          max_drawdown_percent?: number | null
          net_profit?: number
          period_end: string
          period_start: string
          profit_factor?: number | null
          sharpe_ratio?: number | null
          sortino_ratio?: number | null
          total_trades?: number
          winning_trades?: number
          winrate?: number | null
        }
        Update: {
          average_trade?: number | null
          consecutive_losses?: number | null
          consecutive_wins?: number | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          gross_loss?: number
          gross_profit?: number
          id?: string
          largest_loss?: number | null
          largest_win?: number | null
          losing_trades?: number
          max_drawdown?: number | null
          max_drawdown_percent?: number | null
          net_profit?: number
          period_end?: string
          period_start?: string
          profit_factor?: number | null
          sharpe_ratio?: number | null
          sortino_ratio?: number | null
          total_trades?: number
          winning_trades?: number
          winrate?: number | null
        }
        Relationships: []
      }
      risk_events: {
        Row: {
          account_id: string
          action_taken: string | null
          created_at: string
          current_value: number | null
          description: string
          event_type: string
          id: string
          resolved: boolean
          resolved_at: string | null
          severity: string
          strategy_id: string | null
          threshold_value: number | null
        }
        Insert: {
          account_id: string
          action_taken?: string | null
          created_at?: string
          current_value?: number | null
          description: string
          event_type: string
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          severity: string
          strategy_id?: string | null
          threshold_value?: number | null
        }
        Update: {
          account_id?: string
          action_taken?: string | null
          created_at?: string
          current_value?: number | null
          description?: string
          event_type?: string
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          strategy_id?: string | null
          threshold_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_events_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "trading_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      system_metrics: {
        Row: {
          active_strategies: number
          cpu_usage: number
          created_at: string
          disk_usage: number
          gemini_connected: boolean
          id: string
          memory_usage: number
          mt5_connected: boolean
          open_positions: number
          timestamp: string
        }
        Insert: {
          active_strategies?: number
          cpu_usage: number
          created_at?: string
          disk_usage: number
          gemini_connected?: boolean
          id?: string
          memory_usage: number
          mt5_connected?: boolean
          open_positions?: number
          timestamp?: string
        }
        Update: {
          active_strategies?: number
          cpu_usage?: number
          created_at?: string
          disk_usage?: number
          gemini_connected?: boolean
          id?: string
          memory_usage?: number
          mt5_connected?: boolean
          open_positions?: number
          timestamp?: string
        }
        Relationships: []
      }
      trade_journal: {
        Row: {
          account_id: string
          action: string
          confidence: number | null
          execution_data: Json | null
          id: string
          model_features: Json | null
          model_id: string | null
          model_prediction: Json | null
          reason: string
          strategy_id: string | null
          symbol: string
          timestamp: string
          trace_id: string
          trade_id: string
        }
        Insert: {
          account_id: string
          action: string
          confidence?: number | null
          execution_data?: Json | null
          id?: string
          model_features?: Json | null
          model_id?: string | null
          model_prediction?: Json | null
          reason: string
          strategy_id?: string | null
          symbol: string
          timestamp?: string
          trace_id: string
          trade_id: string
        }
        Update: {
          account_id?: string
          action?: string
          confidence?: number | null
          execution_data?: Json | null
          id?: string
          model_features?: Json | null
          model_id?: string | null
          model_prediction?: Json | null
          reason?: string
          strategy_id?: string | null
          symbol?: string
          timestamp?: string
          trace_id?: string
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_journal_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_journal_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_journal_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "trading_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_signals: {
        Row: {
          confidence: number
          created_at: string
          entry_price: number | null
          execution_time: string | null
          expiry_time: string | null
          features: Json | null
          id: string
          model_id: string | null
          model_prediction: Json | null
          position_size: number | null
          signal_time: string
          signal_type: string
          status: string
          stop_loss: number | null
          strategy_id: string
          symbol: string
          take_profit: number | null
          timeframe: string
        }
        Insert: {
          confidence: number
          created_at?: string
          entry_price?: number | null
          execution_time?: string | null
          expiry_time?: string | null
          features?: Json | null
          id?: string
          model_id?: string | null
          model_prediction?: Json | null
          position_size?: number | null
          signal_time: string
          signal_type: string
          status?: string
          stop_loss?: number | null
          strategy_id: string
          symbol: string
          take_profit?: number | null
          timeframe: string
        }
        Update: {
          confidence?: number
          created_at?: string
          entry_price?: number | null
          execution_time?: string | null
          expiry_time?: string | null
          features?: Json | null
          id?: string
          model_id?: string | null
          model_prediction?: Json | null
          position_size?: number | null
          signal_time?: string
          signal_type?: string
          status?: string
          stop_loss?: number | null
          strategy_id?: string
          symbol?: string
          take_profit?: number | null
          timeframe?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_signals_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_signals_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "trading_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_accounts: {
        Row: {
          account_number: string
          account_type: string
          balance: number
          broker: string
          created_at: string
          equity: number
          free_margin: number
          id: string
          is_active: boolean
          margin: number
          margin_level: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          account_type: string
          balance?: number
          broker: string
          created_at?: string
          equity?: number
          free_margin?: number
          id?: string
          is_active?: boolean
          margin?: number
          margin_level?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          account_type?: string
          balance?: number
          broker?: string
          created_at?: string
          equity?: number
          free_margin?: number
          id?: string
          is_active?: boolean
          margin?: number
          margin_level?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trading_orders: {
        Row: {
          account_id: string
          comment: string | null
          created_at: string
          id: string
          magic_number: number | null
          order_id: string
          position_id: string | null
          price: number | null
          price_current: number | null
          state: string
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          time_done: string | null
          time_expiration: string | null
          time_setup: string
          type: string
          updated_at: string
          volume: number
          volume_filled: number | null
        }
        Insert: {
          account_id: string
          comment?: string | null
          created_at?: string
          id?: string
          magic_number?: number | null
          order_id: string
          position_id?: string | null
          price?: number | null
          price_current?: number | null
          state: string
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          time_done?: string | null
          time_expiration?: string | null
          time_setup: string
          type: string
          updated_at?: string
          volume: number
          volume_filled?: number | null
        }
        Update: {
          account_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          magic_number?: number | null
          order_id?: string
          position_id?: string | null
          price?: number | null
          price_current?: number | null
          state?: string
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          time_done?: string | null
          time_expiration?: string | null
          time_setup?: string
          type?: string
          updated_at?: string
          volume?: number
          volume_filled?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trading_orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_positions: {
        Row: {
          account_id: string
          close_price: number | null
          close_time: string | null
          comment: string | null
          commission: number | null
          created_at: string
          id: string
          magic_number: number | null
          open_price: number
          open_time: string
          position_id: string
          profit: number | null
          reason: string | null
          status: string
          stop_loss: number | null
          swap: number | null
          symbol: string
          take_profit: number | null
          type: string
          updated_at: string
          volume: number
        }
        Insert: {
          account_id: string
          close_price?: number | null
          close_time?: string | null
          comment?: string | null
          commission?: number | null
          created_at?: string
          id?: string
          magic_number?: number | null
          open_price: number
          open_time: string
          position_id: string
          profit?: number | null
          reason?: string | null
          status?: string
          stop_loss?: number | null
          swap?: number | null
          symbol: string
          take_profit?: number | null
          type: string
          updated_at?: string
          volume: number
        }
        Update: {
          account_id?: string
          close_price?: number | null
          close_time?: string | null
          comment?: string | null
          commission?: number | null
          created_at?: string
          id?: string
          magic_number?: number | null
          open_price?: number
          open_time?: string
          position_id?: string
          profit?: number | null
          reason?: string | null
          status?: string
          stop_loss?: number | null
          swap?: number | null
          symbol?: string
          take_profit?: number | null
          type?: string
          updated_at?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "trading_positions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_strategies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_daily_loss: number | null
          max_positions: number
          model_id: string | null
          name: string
          parameters: Json
          position_size_type: string
          risk_parameters: Json
          strategy_type: string
          symbols: string[]
          timeframes: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_daily_loss?: number | null
          max_positions?: number
          model_id?: string | null
          name: string
          parameters: Json
          position_size_type?: string
          risk_parameters: Json
          strategy_type: string
          symbols: string[]
          timeframes: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_daily_loss?: number | null
          max_positions?: number
          model_id?: string | null
          name?: string
          parameters?: Json
          position_size_type?: string
          risk_parameters?: Json
          strategy_type?: string
          symbols?: string[]
          timeframes?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_strategies_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_symbols: {
        Row: {
          contract_size: number | null
          created_at: string
          description: string | null
          digits: number
          id: string
          is_active: boolean
          lot_step: number
          margin_required: number | null
          max_lot: number
          min_lot: number
          point: number
          spread: number | null
          swap_long: number | null
          swap_short: number | null
          symbol: string
          tick_size: number | null
          tick_value: number | null
          updated_at: string
        }
        Insert: {
          contract_size?: number | null
          created_at?: string
          description?: string | null
          digits: number
          id?: string
          is_active?: boolean
          lot_step: number
          margin_required?: number | null
          max_lot: number
          min_lot: number
          point: number
          spread?: number | null
          swap_long?: number | null
          swap_short?: number | null
          symbol: string
          tick_size?: number | null
          tick_value?: number | null
          updated_at?: string
        }
        Update: {
          contract_size?: number | null
          created_at?: string
          description?: string | null
          digits?: number
          id?: string
          is_active?: boolean
          lot_step?: number
          margin_required?: number | null
          max_lot?: number
          min_lot?: number
          point?: number
          spread?: number | null
          swap_long?: number | null
          swap_short?: number | null
          symbol?: string
          tick_size?: number | null
          tick_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
