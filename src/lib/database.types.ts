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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ball_events: {
        Row: {
          angle: number | null
          bowler_key: string | null
          created_at: string
          delivery_kind: string | null
          dismissal: string | null
          fielder_key: string | null
          id: string
          innings: number
          is_legal: boolean | null
          kind: string
          match_id: string
          next_batter_key: string | null
          non_striker_key: string | null
          out_key: string | null
          runs: number | null
          seq: number
          striker_key: string | null
          total_runs: number | null
          voided_at: string | null
        }
        Insert: {
          angle?: number | null
          bowler_key?: string | null
          created_at?: string
          delivery_kind?: string | null
          dismissal?: string | null
          fielder_key?: string | null
          id: string
          innings: number
          is_legal?: boolean | null
          kind: string
          match_id: string
          next_batter_key?: string | null
          non_striker_key?: string | null
          out_key?: string | null
          runs?: number | null
          seq?: never
          striker_key?: string | null
          total_runs?: number | null
          voided_at?: string | null
        }
        Update: {
          angle?: number | null
          bowler_key?: string | null
          created_at?: string
          delivery_kind?: string | null
          dismissal?: string | null
          fielder_key?: string | null
          id?: string
          innings?: number
          is_legal?: boolean | null
          kind?: string
          match_id?: string
          next_batter_key?: string | null
          non_striker_key?: string | null
          out_key?: string | null
          runs?: number | null
          seq?: never
          striker_key?: string | null
          total_runs?: number | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ball_events_match_id_bowler_key_fkey"
            columns: ["match_id", "bowler_key"]
            isOneToOne: false
            referencedRelation: "match_players"
            referencedColumns: ["match_id", "key"]
          },
          {
            foreignKeyName: "ball_events_match_id_bowler_key_fkey"
            columns: ["match_id", "bowler_key"]
            isOneToOne: false
            referencedRelation: "player_match_figures"
            referencedColumns: ["match_id", "key"]
          },
          {
            foreignKeyName: "ball_events_match_id_fielder_key_fkey"
            columns: ["match_id", "fielder_key"]
            isOneToOne: false
            referencedRelation: "match_players"
            referencedColumns: ["match_id", "key"]
          },
          {
            foreignKeyName: "ball_events_match_id_fielder_key_fkey"
            columns: ["match_id", "fielder_key"]
            isOneToOne: false
            referencedRelation: "player_match_figures"
            referencedColumns: ["match_id", "key"]
          },
          {
            foreignKeyName: "ball_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ball_events_match_id_next_batter_key_fkey"
            columns: ["match_id", "next_batter_key"]
            isOneToOne: false
            referencedRelation: "match_players"
            referencedColumns: ["match_id", "key"]
          },
          {
            foreignKeyName: "ball_events_match_id_next_batter_key_fkey"
            columns: ["match_id", "next_batter_key"]
            isOneToOne: false
            referencedRelation: "player_match_figures"
            referencedColumns: ["match_id", "key"]
          },
          {
            foreignKeyName: "ball_events_match_id_non_striker_key_fkey"
            columns: ["match_id", "non_striker_key"]
            isOneToOne: false
            referencedRelation: "match_players"
            referencedColumns: ["match_id", "key"]
          },
          {
            foreignKeyName: "ball_events_match_id_non_striker_key_fkey"
            columns: ["match_id", "non_striker_key"]
            isOneToOne: false
            referencedRelation: "player_match_figures"
            referencedColumns: ["match_id", "key"]
          },
          {
            foreignKeyName: "ball_events_match_id_out_key_fkey"
            columns: ["match_id", "out_key"]
            isOneToOne: false
            referencedRelation: "match_players"
            referencedColumns: ["match_id", "key"]
          },
          {
            foreignKeyName: "ball_events_match_id_out_key_fkey"
            columns: ["match_id", "out_key"]
            isOneToOne: false
            referencedRelation: "player_match_figures"
            referencedColumns: ["match_id", "key"]
          },
          {
            foreignKeyName: "ball_events_match_id_striker_key_fkey"
            columns: ["match_id", "striker_key"]
            isOneToOne: false
            referencedRelation: "match_players"
            referencedColumns: ["match_id", "key"]
          },
          {
            foreignKeyName: "ball_events_match_id_striker_key_fkey"
            columns: ["match_id", "striker_key"]
            isOneToOne: false
            referencedRelation: "player_match_figures"
            referencedColumns: ["match_id", "key"]
          },
        ]
      }
      friendly_abandoned_ids: {
        Row: {
          abandoned_at: string
          match_id: string
          user_id: string
        }
        Insert: {
          abandoned_at?: string
          match_id: string
          user_id?: string
        }
        Update: {
          abandoned_at?: string
          match_id?: string
          user_id?: string
        }
        Relationships: []
      }
      match_players: {
        Row: {
          in_playing_xi: boolean
          key: string
          match_id: string
          name: string
          profile_id: string | null
          role: string | null
          side: string
          sort_order: number
        }
        Insert: {
          in_playing_xi?: boolean
          key: string
          match_id: string
          name: string
          profile_id?: string | null
          role?: string | null
          side: string
          sort_order: number
        }
        Update: {
          in_playing_xi?: boolean
          key?: string
          match_id?: string
          name?: string
          profile_id?: string | null
          role?: string | null
          side?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_scorers: {
        Row: {
          added_at: string
          match_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          match_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          match_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_scorers_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          fixture_ref: string | null
          id: string
          overs_limit: number
          record_shots: boolean
          result_margin: number | null
          result_summary: string | null
          result_type: string | null
          scheduled_at: string | null
          score_head: string | null
          started_at: string | null
          status: string
          team_a_balls: number | null
          team_a_image_url: string | null
          team_a_name: string
          team_a_runs: number | null
          team_a_short: string
          team_a_tone: string
          team_a_wickets: number | null
          team_b_balls: number | null
          team_b_image_url: string | null
          team_b_name: string
          team_b_runs: number | null
          team_b_short: string
          team_b_tone: string
          team_b_wickets: number | null
          title: string | null
          toss_decision: string | null
          toss_winner_side: string | null
          tournament_id: string | null
          updated_at: string
          winner_side: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          fixture_ref?: string | null
          id?: string
          overs_limit?: number
          record_shots?: boolean
          result_margin?: number | null
          result_summary?: string | null
          result_type?: string | null
          scheduled_at?: string | null
          score_head?: string | null
          started_at?: string | null
          status?: string
          team_a_balls?: number | null
          team_a_image_url?: string | null
          team_a_name: string
          team_a_runs?: number | null
          team_a_short: string
          team_a_tone: string
          team_a_wickets?: number | null
          team_b_balls?: number | null
          team_b_image_url?: string | null
          team_b_name: string
          team_b_runs?: number | null
          team_b_short: string
          team_b_tone: string
          team_b_wickets?: number | null
          title?: string | null
          toss_decision?: string | null
          toss_winner_side?: string | null
          tournament_id?: string | null
          updated_at?: string
          winner_side?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          fixture_ref?: string | null
          id?: string
          overs_limit?: number
          record_shots?: boolean
          result_margin?: number | null
          result_summary?: string | null
          result_type?: string | null
          scheduled_at?: string | null
          score_head?: string | null
          started_at?: string | null
          status?: string
          team_a_balls?: number | null
          team_a_image_url?: string | null
          team_a_name?: string
          team_a_runs?: number | null
          team_a_short?: string
          team_a_tone?: string
          team_a_wickets?: number | null
          team_b_balls?: number | null
          team_b_image_url?: string | null
          team_b_name?: string
          team_b_runs?: number | null
          team_b_short?: string
          team_b_tone?: string
          team_b_wickets?: number | null
          title?: string | null
          toss_decision?: string | null
          toss_winner_side?: string | null
          tournament_id?: string | null
          updated_at?: string
          winner_side?: string | null
        }
        Relationships: []
      }
      profile_private: {
        Row: {
          blood_group: string | null
          id: string
          national_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          blood_group?: string | null
          id: string
          national_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          blood_group?: string | null
          id?: string
          national_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area: string | null
          avatar_url: string | null
          batting_style: string | null
          created_at: string
          district: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          avatar_url?: string | null
          batting_style?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          avatar_url?: string | null
          batting_style?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scorer_handover: {
        Row: {
          created_at: string
          expires_at: string
          from_user: string
          id: string
          initiated_by: string
          match_id: string
          resolved_at: string | null
          status: string
          to_user: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          from_user: string
          id?: string
          initiated_by: string
          match_id: string
          resolved_at?: string | null
          status?: string
          to_user: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          from_user?: string
          id?: string
          initiated_by?: string
          match_id?: string
          resolved_at?: string | null
          status?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "scorer_handover_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      player_career_stats: {
        Row: {
          balls_bowled: number | null
          balls_faced: number | null
          batting_average: number | null
          fours: number | null
          highest: number | null
          highest_not_out: boolean | null
          innings: number | null
          matches: number | null
          not_outs: number | null
          profile_id: string | null
          runs: number | null
          runs_conceded: number | null
          sixes: number | null
          wickets: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_match_figures: {
        Row: {
          balls_bowled: number | null
          balls_faced: number | null
          batted: boolean | null
          completed_at: string | null
          fours: number | null
          key: string | null
          match_id: string | null
          not_out: boolean | null
          profile_id: string | null
          runs: number | null
          runs_conceded: number | null
          sixes: number | null
          wickets: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      abandon_friendly_matches: { Args: { p_ids: string[] }; Returns: string[] }
      accept_scorer_handover: { Args: { p_id: string }; Returns: undefined }
      append_ball_event: {
        Args: { p_expected_head: string; p_row: Json }
        Returns: undefined
      }
      begin_scoring_write: { Args: { p_match: string }; Returns: undefined }
      can_score_match: { Args: { p_match: string }; Returns: boolean }
      cancel_scorer_handover: { Args: { p_id: string }; Returns: undefined }
      claim_score_head: {
        Args: { p_expected_head: string; p_match: string; p_op: string }
        Returns: boolean
      }
      create_friendly_match: {
        Args: { p_match: Json; p_players: Json; p_scorer?: string }
        Returns: string
      }
      decline_scorer_handover: { Args: { p_id: string }; Returns: undefined }
      offer_scorer_handover: {
        Args: { p_match: string; p_to: string }
        Returns: string
      }
      reopen_match: {
        Args: { p_expected_head: string; p_match: string; p_op: string }
        Returns: undefined
      }
      save_match_result: {
        Args: {
          p_expected_head: string
          p_match: string
          p_op: string
          p_result: Json
        }
        Returns: undefined
      }
      void_ball_events_from: {
        Args: {
          p_event: string
          p_expected_head: string
          p_match: string
          p_op: string
        }
        Returns: undefined
      }
      void_events_from: {
        Args: { p_event: string; p_match: string }
        Returns: number
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
