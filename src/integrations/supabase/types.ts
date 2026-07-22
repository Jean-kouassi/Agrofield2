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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      crop_events: {
        Row: {
          created_at: string
          event_date: string
          event_type: string
          id: string
          notes: string | null
          parcel_id: string
          user_id: string
          yield_kg: number | null
        }
        Insert: {
          created_at?: string
          event_date?: string
          event_type: string
          id?: string
          notes?: string | null
          parcel_id: string
          user_id: string
          yield_kg?: number | null
        }
        Update: {
          created_at?: string
          event_date?: string
          event_type?: string
          id?: string
          notes?: string | null
          parcel_id?: string
          user_id?: string
          yield_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_events_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      disease_analyses: {
        Row: {
          confidence: string | null
          created_at: string
          disease_name: string | null
          id: string
          parcel_id: string | null
          prevention: string | null
          raw_response: Json | null
          severity: string | null
          storage_path: string | null
          treatment: string | null
          user_id: string
        }
        Insert: {
          confidence?: string | null
          created_at?: string
          disease_name?: string | null
          id?: string
          parcel_id?: string | null
          prevention?: string | null
          raw_response?: Json | null
          severity?: string | null
          storage_path?: string | null
          treatment?: string | null
          user_id: string
        }
        Update: {
          confidence?: string | null
          created_at?: string
          disease_name?: string | null
          id?: string
          parcel_id?: string | null
          prevention?: string | null
          raw_response?: Json | null
          severity?: string | null
          storage_path?: string | null
          treatment?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disease_analyses_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_fcfa: number
          category: string
          created_at: string
          description: string | null
          flagged_outlier: boolean
          id: string
          locked_at: string
          parcel_id: string | null
          prev_hash: string | null
          proof_ref: string | null
          proof_type: string | null
          receipt_path: string | null
          record_hash: string | null
          spent_at: string
          user_id: string
          witness_name: string | null
          witness_village: string | null
        }
        Insert: {
          amount_fcfa?: number
          category: string
          created_at?: string
          description?: string | null
          flagged_outlier?: boolean
          id?: string
          locked_at?: string
          parcel_id?: string | null
          prev_hash?: string | null
          proof_ref?: string | null
          proof_type?: string | null
          receipt_path?: string | null
          record_hash?: string | null
          spent_at?: string
          user_id: string
          witness_name?: string | null
          witness_village?: string | null
        }
        Update: {
          amount_fcfa?: number
          category?: string
          created_at?: string
          description?: string | null
          flagged_outlier?: boolean
          id?: string
          locked_at?: string
          parcel_id?: string | null
          prev_hash?: string | null
          proof_ref?: string | null
          proof_type?: string | null
          receipt_path?: string | null
          record_hash?: string | null
          spent_at?: string
          user_id?: string
          witness_name?: string | null
          witness_village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      irrigation_commands: {
        Row: {
          acked_at: string | null
          action: string
          completed_at: string | null
          created_at: string
          device_id: string
          duration_seconds: number
          id: string
          status: string
          user_id: string
        }
        Insert: {
          acked_at?: string | null
          action: string
          completed_at?: string | null
          created_at?: string
          device_id: string
          duration_seconds?: number
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          acked_at?: string | null
          action?: string
          completed_at?: string | null
          created_at?: string
          device_id?: string
          duration_seconds?: number
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "irrigation_commands_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "sensor_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      parcels: {
        Row: {
          area_ha: number
          created_at: string
          crop_type: string
          id: string
          name: string
          notes: string | null
          sowing_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area_ha?: number
          created_at?: string
          crop_type: string
          id?: string
          name: string
          notes?: string | null
          sowing_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area_ha?: number
          created_at?: string
          crop_type?: string
          id?: string
          name?: string
          notes?: string | null
          sowing_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      price_references: {
        Row: {
          created_at: string
          id: string
          key: string
          kind: string
          max_fcfa: number
          min_fcfa: number
          note: string | null
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          kind: string
          max_fcfa: number
          min_fcfa: number
          note?: string | null
          unit: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          kind?: string
          max_fcfa?: number
          min_fcfa?: number
          note?: string | null
          unit?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          expense_alert_threshold: number | null
          full_name: string | null
          id: string
          phone: string | null
          region: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          created_at?: string
          expense_alert_threshold?: number | null
          full_name?: string | null
          id: string
          phone?: string | null
          region?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          created_at?: string
          expense_alert_threshold?: number | null
          full_name?: string | null
          id?: string
          phone?: string | null
          region?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          buyer: string | null
          created_at: string
          crop_type: string
          flagged_outlier: boolean
          id: string
          locked_at: string
          parcel_id: string | null
          prev_hash: string | null
          proof_ref: string | null
          proof_type: string | null
          quantity_kg: number
          receipt_path: string | null
          record_hash: string | null
          sold_at: string
          unit_price_fcfa: number
          user_id: string
          witness_name: string | null
          witness_village: string | null
        }
        Insert: {
          buyer?: string | null
          created_at?: string
          crop_type: string
          flagged_outlier?: boolean
          id?: string
          locked_at?: string
          parcel_id?: string | null
          prev_hash?: string | null
          proof_ref?: string | null
          proof_type?: string | null
          quantity_kg?: number
          receipt_path?: string | null
          record_hash?: string | null
          sold_at?: string
          unit_price_fcfa?: number
          user_id: string
          witness_name?: string | null
          witness_village?: string | null
        }
        Update: {
          buyer?: string | null
          created_at?: string
          crop_type?: string
          flagged_outlier?: boolean
          id?: string
          locked_at?: string
          parcel_id?: string | null
          prev_hash?: string | null
          proof_ref?: string | null
          proof_type?: string | null
          quantity_kg?: number
          receipt_path?: string | null
          record_hash?: string | null
          sold_at?: string
          unit_price_fcfa?: number
          user_id?: string
          witness_name?: string | null
          witness_village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_alerts: {
        Row: {
          created_at: string
          device_id: string
          id: string
          kind: string
          message: string
          parcel_id: string | null
          resolved_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          kind: string
          message: string
          parcel_id?: string | null
          resolved_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          kind?: string
          message?: string
          parcel_id?: string | null
          resolved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sensor_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "sensor_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensor_alerts_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_devices: {
        Row: {
          connectivity_mode: string
          created_at: string
          device_key: string
          firmware_version: string | null
          hardware_model: string | null
          id: string
          last_alert_sent_at: string | null
          last_seen_at: string | null
          moisture_alert_threshold_pct: number
          name: string
          parcel_id: string | null
          sample_interval_seconds: number
          sim_iccid: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connectivity_mode?: string
          created_at?: string
          device_key: string
          firmware_version?: string | null
          hardware_model?: string | null
          id?: string
          last_alert_sent_at?: string | null
          last_seen_at?: string | null
          moisture_alert_threshold_pct?: number
          name: string
          parcel_id?: string | null
          sample_interval_seconds?: number
          sim_iccid?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connectivity_mode?: string
          created_at?: string
          device_key?: string
          firmware_version?: string | null
          hardware_model?: string | null
          id?: string
          last_alert_sent_at?: string | null
          last_seen_at?: string | null
          moisture_alert_threshold_pct?: number
          name?: string
          parcel_id?: string | null
          sample_interval_seconds?: number
          sim_iccid?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sensor_devices_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_readings: {
        Row: {
          battery_pct: number | null
          conductivity: number | null
          created_at: string
          device_id: string
          humidity_pct: number | null
          id: string
          light_lux: number | null
          parcel_id: string | null
          ph: number | null
          rain_mm: number | null
          recorded_at: string
          soil_moisture_pct: number | null
          soil_moisture_root_pct: number | null
          soil_moisture_surface_pct: number | null
          soil_temperature_c: number | null
          source: string
          temperature_c: number | null
          user_id: string
          weather_summary: string | null
        }
        Insert: {
          battery_pct?: number | null
          conductivity?: number | null
          created_at?: string
          device_id: string
          humidity_pct?: number | null
          id?: string
          light_lux?: number | null
          parcel_id?: string | null
          ph?: number | null
          rain_mm?: number | null
          recorded_at?: string
          soil_moisture_pct?: number | null
          soil_moisture_root_pct?: number | null
          soil_moisture_surface_pct?: number | null
          soil_temperature_c?: number | null
          source?: string
          temperature_c?: number | null
          user_id: string
          weather_summary?: string | null
        }
        Update: {
          battery_pct?: number | null
          conductivity?: number | null
          created_at?: string
          device_id?: string
          humidity_pct?: number | null
          id?: string
          light_lux?: number | null
          parcel_id?: string | null
          ph?: number | null
          rain_mm?: number | null
          recorded_at?: string
          soil_moisture_pct?: number | null
          soil_moisture_root_pct?: number | null
          soil_moisture_surface_pct?: number | null
          soil_temperature_c?: number | null
          source?: string
          temperature_c?: number | null
          user_id?: string
          weather_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "sensor_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensor_readings_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      sensor_low_moisture_check: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "super_admin" | "user"
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
    Enums: {
      app_role: ["super_admin", "user"],
    },
  },
} as const
