import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchOfficialRequest {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  district?: string;
  pincode?: string;
  ward?: string;
  area?: string;
}

interface Official {
  user_id: string;
  full_name: string;
  city: string;
  state: string;
  district?: string;
  pincode?: string;
  ward?: string;
  area?: string;
  geo_bounds?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { latitude, longitude, city, state, district, pincode, ward, area }: MatchOfficialRequest = await req.json();

    // Fuzzy matching algorithm for finding best official
    const { data: officials, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, city, state, district, pincode, ward, area, geo_bounds')
      .eq('role', 'official')
      .eq('is_verified', true);

    if (error) {
      throw new Error(`Failed to fetch officials: ${error.message}`);
    }

    if (!officials || officials.length === 0) {
      return new Response(JSON.stringify({ 
        matched_official: null,
        alternatives: [],
        message: 'No verified officials found'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // AI-assisted matching logic with scoring
    const scoredOfficials = officials.map((official: Official) => {
      let score = 0;
      let matchReasons: string[] = [];

      // Exact matches get highest priority
      if (official.pincode && pincode && official.pincode === pincode) {
        score += 100;
        matchReasons.push('Exact pincode match');
      }

      if (official.ward && ward && official.ward.toLowerCase() === ward.toLowerCase()) {
        score += 80;
        matchReasons.push('Exact ward match');
      }

      if (official.area && area && official.area.toLowerCase() === area.toLowerCase()) {
        score += 70;
        matchReasons.push('Exact area match');
      }

      // Fuzzy matches for broader coverage
      if (official.city && city && official.city.toLowerCase() === city.toLowerCase()) {
        score += 50;
        matchReasons.push('City match');
      }

      if (official.state && state && official.state.toLowerCase() === state.toLowerCase()) {
        score += 30;
        matchReasons.push('State match');
      }

      if (official.district && district && official.district.toLowerCase() === district.toLowerCase()) {
        score += 40;
        matchReasons.push('District match');
      }

      // Geographic bounds check (if official has defined coverage area)
      if (official.geo_bounds && latitude && longitude) {
        const bounds = official.geo_bounds;
        if (bounds.north && bounds.south && bounds.east && bounds.west) {
          if (latitude <= bounds.north && latitude >= bounds.south && 
              longitude <= bounds.east && longitude >= bounds.west) {
            score += 60;
            matchReasons.push('Within coverage area');
          }
        }
      }

      // Partial matches for flexibility
      if (official.pincode && pincode) {
        const pincodeDistance = Math.abs(parseInt(official.pincode) - parseInt(pincode));
        if (pincodeDistance <= 10) { // Similar pincodes (nearby areas)
          score += Math.max(20 - pincodeDistance, 5);
          matchReasons.push('Nearby pincode');
        }
      }

      return {
        ...official,
        score,
        matchReasons
      };
    });

    // Sort by score (highest first)
    scoredOfficials.sort((a, b) => b.score - a.score);

    // Get the best match and alternatives
    const bestMatch = scoredOfficials[0];
    const alternatives = scoredOfficials.slice(1, 4); // Top 3 alternatives

    // Only consider it a good match if score is above threshold
    const matchedOfficial = bestMatch.score >= 30 ? bestMatch : null;

    console.log(`Official matching for ${city}, ${state}:`);
    console.log(`Best match: ${bestMatch.full_name} (Score: ${bestMatch.score})`);
    console.log(`Match reasons: ${bestMatch.matchReasons.join(', ')}`);

    return new Response(JSON.stringify({
      matched_official: matchedOfficial ? {
        user_id: matchedOfficial.user_id,
        full_name: matchedOfficial.full_name,
        score: matchedOfficial.score,
        match_reasons: matchedOfficial.matchReasons,
        location: {
          city: matchedOfficial.city,
          state: matchedOfficial.state,
          district: matchedOfficial.district,
          pincode: matchedOfficial.pincode,
          ward: matchedOfficial.ward,
          area: matchedOfficial.area
        }
      } : null,
      alternatives: alternatives.filter(alt => alt.score >= 20).map(alt => ({
        user_id: alt.user_id,
        full_name: alt.full_name,
        score: alt.score,
        match_reasons: alt.matchReasons,
        location: {
          city: alt.city,
          state: alt.state,
          district: alt.district,
          pincode: alt.pincode,
          ward: alt.ward,
          area: alt.area
        }
      })),
      total_officials_checked: officials.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in match-official function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);