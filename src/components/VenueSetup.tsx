import { useState, useEffect } from 'react';
import { Monitor, MapPin, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Venue {
  id: string;
  name: string;
}

interface VenueSetupProps {
  onVenueSelected: (venueId: string, venueName: string) => void;
}

export default function VenueSetup({ onVenueSelected }: VenueSetupProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('venues')
      .select('id, name')
      .order('name');

    if (fetchError) {
      setError('Failed to load venues. Please try again.');
    } else {
      setVenues(data || []);
    }
    setLoading(false);
  };

  const handleConfirm = async () => {
    if (!selectedVenueId) return;

    setRegistering(true);
    const venue = venues.find(v => v.id === selectedVenueId);
    if (!venue) return;

    const { error: insertError } = await supabase
      .from('screens')
      .insert({
        venue_id: selectedVenueId,
        name: `Screen ${Date.now().toString(36).slice(-4).toUpperCase()}`,
        is_active: true,
        last_seen_at: new Date().toISOString(),
      });

    if (insertError) {
      setError('Failed to register screen. Please try again.');
      setRegistering(false);
      return;
    }

    onVenueSelected(selectedVenueId, venue.name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8 w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4 shadow-lg shadow-emerald-500/20">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Screen Setup</h1>
          <p className="text-slate-400">Select the venue this screen is located at</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Venue
            </label>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                <span className="ml-2 text-slate-400">Loading venues...</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedVenueId}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  className="w-full appearance-none bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer text-lg"
                >
                  <option value="" disabled>
                    Choose a venue...
                  </option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedVenueId || registering}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {registering ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Monitor className="w-5 h-5" />
                Confirm Venue
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-500">
            Matches will be started remotely once this screen is registered.
          </p>
        </div>
      </div>
    </div>
  );
}
