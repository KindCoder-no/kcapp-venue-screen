import { useEffect, useState } from 'react';
import { Monitor, MapPin, Loader2, ChevronDown } from 'lucide-react';
import { fetchVenuePlayers, fetchVenues, kcappConfig } from '../lib/kcapp';
import { VenueInfo } from '../types/kcapp';

interface VenueSetupProps {
  onVenueSelected: (venue: VenueInfo) => void;
}

export default function VenueSetup({ onVenueSelected }: VenueSetupProps) {
  const [venues, setVenues] = useState<VenueInfo[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadVenues();
  }, []);

  const loadVenues = async () => {
    setLoadingVenues(true);
    setError(null);

    try {
      const availableVenues = await fetchVenues();
      setVenues(availableVenues);

      if (!selectedVenueId && availableVenues.length > 0) {
        setSelectedVenueId(availableVenues[0].id);
      }
    } catch (error) {
      console.error('Venue load failed', {
        error,
        venueListUrl: kcappConfig.venueListUrl,
        apiBaseUrl: kcappConfig.apiBaseUrl,
      });

      const details = error instanceof Error ? error.message : 'Unknown error';
      setVenues([]);
      setError(`Unable to load venues from /api/venue. ${details}`);
    } finally {
      setLoadingVenues(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedVenueId) {
      return;
    }

    setRegistering(true);
    setError(null);

    try {
      await fetchVenuePlayers(selectedVenueId);
    } catch (error) {
      console.error('Venue verification failed', {
        error,
        selectedVenueId,
        apiBaseUrl: kcappConfig.apiBaseUrl,
      });

      const details = error instanceof Error ? error.message : 'Unknown error';
      setError(`Unable to verify venue against kcapp API. ${details}`);
      setRegistering(false);
      return;
    }

    const venue = venues.find((entry) => entry.id === selectedVenueId);
    const venueName = venue?.name ?? `Venue ${selectedVenueId}`;

    localStorage.setItem('venue_id', selectedVenueId);
    localStorage.setItem('remote-control', 'true');

    onVenueSelected({
      id: selectedVenueId,
      name: venueName,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8 w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4 shadow-lg shadow-emerald-500/20">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Screen Setup</h1>
          <p className="text-slate-400">Connect this screen to a kcapp venue</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/30 p-4 text-sm text-slate-300">
            {kcappConfig.basicAuthConfigured
              ? 'Basic auth is enabled from env variables.'
              : 'Basic auth is not set in env variables.'}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Venue
            </label>
            {loadingVenues ? (
              <div className="w-full bg-slate-700/30 border border-slate-600 rounded-lg px-4 py-4 text-slate-300 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading venues from /api/venue...
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedVenueId}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  className="w-full appearance-none bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer text-lg"
                >
                  {venues.length === 0 && (
                    <option value="" disabled>
                      No venues found
                    </option>
                  )}
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            )}

            <button
              onClick={() => void loadVenues()}
              disabled={loadingVenues}
              className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
            >
              Refresh venues
            </button>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedVenueId || registering || loadingVenues}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {registering ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Monitor className="w-5 h-5" />
                Connect Venue
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
