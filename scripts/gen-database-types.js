'use strict';

const fs = require('fs');
const path = require('path');

/** Column modes: req = required on insert, opt = default or nullable, gen = identity, row only. */
const tables = {
  profiles: [
    ['id', 'string', 'req'],
    ['full_name', 'string | null', 'opt'],
    ['avatar_url', 'string | null', 'opt'],
    ['area', 'string | null', 'opt'],
    ['district', 'string | null', 'opt'],
    ['role', "'batter' | 'bowler' | 'all-rounder' | 'keeper' | null", 'opt'],
    ['batting_style', "'right' | 'left' | null", 'opt'],
    ['created_at', 'string', 'opt'],
    ['updated_at', 'string', 'opt'],
  ],
  profile_private: [
    ['id', 'string', 'req'],
    ['phone', 'string | null', 'opt'],
    ['national_id', 'string | null', 'opt'],
    ['blood_group', "'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null", 'opt'],
    ['updated_at', 'string', 'opt'],
  ],
  matches: [
    ['id', 'string', 'opt'],
    ['tournament_id', 'string | null', 'opt'],
    ['fixture_ref', 'string | null', 'opt'],
    ['created_by', 'string | null', 'opt'],
    ['title', 'string | null', 'opt'],
    ['team_a_name', 'string', 'req'],
    ['team_a_short', 'string', 'req'],
    ['team_a_tone', "'blue' | 'yellow' | 'neutral'", 'req'],
    ['team_b_name', 'string', 'req'],
    ['team_b_short', 'string', 'req'],
    ['team_b_tone', "'blue' | 'yellow' | 'neutral'", 'req'],
    ['overs_limit', 'number', 'opt'],
    ['status', "'scheduled' | 'live' | 'completed'", 'opt'],
    ['toss_winner_side', "'a' | 'b' | null", 'opt'],
    ['toss_decision', "'bat' | 'bowl' | null", 'opt'],
    ['record_shots', 'boolean', 'opt'],
    ['scheduled_at', 'string | null', 'opt'],
    ['started_at', 'string | null', 'opt'],
    ['completed_at', 'string | null', 'opt'],
    ['team_a_runs', 'number | null', 'opt'],
    ['team_a_wickets', 'number | null', 'opt'],
    ['team_a_balls', 'number | null', 'opt'],
    ['team_b_runs', 'number | null', 'opt'],
    ['team_b_wickets', 'number | null', 'opt'],
    ['team_b_balls', 'number | null', 'opt'],
    ['winner_side', "'a' | 'b' | null", 'opt'],
    ['result_type', "'runs' | 'wickets' | 'tie' | null", 'opt'],
    ['result_margin', 'number | null', 'opt'],
    ['result_summary', 'string | null', 'opt'],
    ['created_at', 'string', 'opt'],
    ['updated_at', 'string', 'opt'],
  ],
  match_players: [
    ['match_id', 'string', 'req'],
    ['key', 'string', 'req'],
    ['side', "'a' | 'b'", 'req'],
    ['name', 'string', 'req'],
    ['role', 'string | null', 'opt'],
    ['in_playing_xi', 'boolean', 'opt'],
    ['sort_order', 'number', 'req'],
    ['profile_id', 'string | null', 'opt'],
  ],
  match_scorers: [
    ['match_id', 'string', 'req'],
    ['user_id', 'string', 'req'],
    ['added_at', 'string', 'opt'],
  ],
  ball_events: [
    ['id', 'string', 'req'],
    ['match_id', 'string', 'req'],
    ['seq', 'number', 'gen'],
    ['innings', '1 | 2', 'req'],
    ['kind', "'innings_start' | 'delivery' | 'bowler' | 'swap_ends'", 'req'],
    ['striker_key', 'string | null', 'opt'],
    ['non_striker_key', 'string | null', 'opt'],
    ['bowler_key', 'string | null', 'opt'],
    ['delivery_kind', "'runs' | 'wide' | 'no-ball' | 'bye' | 'leg-bye' | 'wicket' | null", 'opt'],
    ['runs', 'number | null', 'opt'],
    ['total_runs', 'number | null', 'opt'],
    ['is_legal', 'boolean | null', 'opt'],
    ['dismissal', "'Bowled' | 'Caught' | 'LBW' | 'Run out' | 'Stumped' | 'Caught & bowled' | 'Hit wicket' | null", 'opt'],
    ['out_key', 'string | null', 'opt'],
    ['next_batter_key', 'string | null', 'opt'],
    ['fielder_key', 'string | null', 'opt'],
    ['angle', 'number | null', 'opt'],
    ['voided_at', 'string | null', 'opt'],
    ['created_at', 'string', 'opt'],
  ],
};

const views = {
  player_match_figures: [
    ['profile_id', 'string'],
    ['match_id', 'string'],
    ['key', 'string'],
    ['completed_at', 'string'],
    ['batted', 'boolean'],
    ['runs', 'number'],
    ['balls_faced', 'number'],
    ['fours', 'number'],
    ['sixes', 'number'],
    ['not_out', 'boolean'],
    ['balls_bowled', 'number'],
    ['runs_conceded', 'number'],
    ['wickets', 'number'],
  ],
  player_career_stats: [
    ['profile_id', 'string'],
    ['matches', 'number'],
    ['innings', 'number'],
    ['not_outs', 'number'],
    ['runs', 'number'],
    ['balls_faced', 'number'],
    ['fours', 'number'],
    ['sixes', 'number'],
    ['highest', 'number | null'],
    ['highest_not_out', 'boolean | null'],
    ['batting_average', 'number | null'],
    ['wickets', 'number'],
    ['balls_bowled', 'number'],
    ['runs_conceded', 'number'],
  ],
};

const functions = {
  can_score_match: { args: [['p_match', 'string']], returns: 'boolean' },
  void_events_from: { args: [['p_match', 'string'], ['p_event', 'string']], returns: 'number' },
};

const field = (name, type, optional) => `          ${name}${optional ? '?' : ''}: ${type}`;
const block = (lines) => lines.join('\n');

function renderTable([name, columns]) {
  const writable = columns.filter((column) => column[2] !== 'gen');
  return `      ${name}: {
        Row: {
${block(columns.map(([column, type]) => field(column, type, false)))}
        }
        Insert: {
${block(writable.map(([column, type, mode]) => field(column, type, mode !== 'req')))}
        }
        Update: {
${block(writable.map(([column, type]) => field(column, type, true)))}
        }
        Relationships: []
      }`;
}

function renderView([name, columns]) {
  return `      ${name}: {
        Row: {
${block(columns.map(([column, type]) => field(column, type, false)))}
        }
        Relationships: []
      }`;
}

function renderFunction([name, fn]) {
  return `      ${name}: {
        Args: { ${fn.args.map(([arg, type]) => `${arg}: ${type}`).join('; ')} }
        Returns: ${fn.returns}
      }`;
}

const output = `// Generated by scripts/gen-database-types.js from the local migrations.
// Schema types: excluded from the handwritten line cap (memory.md section 3).
// Migrations: 20261028000000_profiles, 20261029000000_matches, 20261030000000_player_career_stats.

export type Database = {
  public: {
    Tables: {
${Object.entries(tables).map(renderTable).join('\n')}
    }
    Views: {
${Object.entries(views).map(renderView).join('\n')}
    }
    Functions: {
${Object.entries(functions).map(renderFunction).join('\n')}
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
`;

const destination = path.join(__dirname, '..', 'src', 'lib', 'database.types.ts');
fs.writeFileSync(destination, output);
console.log(`wrote ${path.relative(process.cwd(), destination)}`);
