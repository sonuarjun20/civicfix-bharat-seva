import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Camera, Upload, Loader2, CheckCircle, User, Info, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

// Set Mapbox access token - user will need to provide this
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN_HERE';

const issueSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  issue_type: z.enum(['road', 'water', 'electricity', 'garbage', 'streetlight', 'sewage', 'other']),
  address: z.string().optional(),
  area: z.string().min(2, 'Area is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  ward: z.string().optional(),
  district: z.string().optional(),
  assigned_official_id: z.string().optional(),
  suggested_official_id: z.string().optional(),
  media_files: z.any().optional(),
});

type IssueFormData = z.infer<typeof issueSchema>;

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  ward?: string;
  district?: string;
}

interface MatchedOfficial {
  user_id: string;
  full_name: string;
  score: number;
  match_reasons: string[];
  location: {
    city: string;
    state: string;
    district?: string;
    pincode?: string;
    ward?: string;
    area?: string;
  };
}

export const IssueReportForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [matchedOfficial, setMatchedOfficial] = useState<MatchedOfficial | null>(null);
  const [alternativeOfficials, setAlternativeOfficials] = useState<MatchedOfficial[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [selectedOfficialId, setSelectedOfficialId] = useState<string>('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema)
  });

  const watchedLocation = watch(['address', 'area', 'city', 'state', 'pincode', 'ward']);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [77.2090, 28.6139], // Default to Delhi
      zoom: 10
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add click handler for manual pin drop
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      updateMarker(lng, lat);
      reverseGeocode(lng, lat);
    });

    return () => map.current?.remove();
  }, []);

  const updateMarker = (lng: number, lat: number) => {
    if (marker.current) {
      marker.current.remove();
    }
    
    marker.current = new mapboxgl.Marker({ color: '#FF9933' })
      .setLngLat([lng, lat])
      .addTo(map.current!);
      
    setLocation(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive"
      });
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateMarker(longitude, latitude);
        map.current?.flyTo({ center: [longitude, latitude], zoom: 15 });
        reverseGeocode(longitude, latitude);
        setIsLoadingLocation(false);
      },
      (error) => {
        toast({
          title: "Location error",
          description: "Could not get your current location",
          variant: "destructive"
        });
        setIsLoadingLocation(false);
      }
    );
  };

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      // In production, use Mapbox geocoding API with your token
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const feature = data.features[0];
        
        if (feature) {
          const locationData: LocationData = {
            latitude: lat,
            longitude: lng,
            address: feature.place_name,
            city: feature.context?.find((c: any) => c.id.includes('place'))?.text || 'Delhi',
            state: feature.context?.find((c: any) => c.id.includes('region'))?.text || 'Delhi',
            area: feature.context?.find((c: any) => c.id.includes('locality'))?.text || '',
            ward: feature.context?.find((c: any) => c.id.includes('district'))?.text || '',
            pincode: feature.context?.find((c: any) => c.id.includes('postcode'))?.text || '',
            district: feature.context?.find((c: any) => c.id.includes('district'))?.text || ''
          };
          
          // Update form fields with geocoded data
          setValue('address', locationData.address || '');
          setValue('area', locationData.area!);
          setValue('city', locationData.city!);
          setValue('state', locationData.state!);
          setValue('pincode', locationData.pincode!);
          setValue('ward', locationData.ward!);
          setValue('district', locationData.district!);
          
          setLocation(locationData);
          
          // Trigger AI-assisted official matching
          await matchOfficialForLocation(locationData);
        }
      } else {
        // Fallback for demo purposes
        const locationData: LocationData = {
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          area: 'Demo Area',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          ward: 'Ward 1'
        };
        
        setValue('address', locationData.address);
        setValue('area', locationData.area!);
        setValue('city', locationData.city!);
        setValue('state', locationData.state!);
        setValue('pincode', locationData.pincode!);
        setValue('ward', locationData.ward!);
        
        setLocation(locationData);
        await matchOfficialForLocation(locationData);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  const matchOfficialForLocation = async (locationData: LocationData) => {
    if (!locationData.city || !locationData.state) return;
    
    setIsMatching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('match-official', {
        body: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          city: locationData.city,
          state: locationData.state,
          district: locationData.district,
          pincode: locationData.pincode,
          ward: locationData.ward,
          area: locationData.area
        }
      });
      
      if (error) throw error;
      
      if (data.matched_official) {
        setMatchedOfficial(data.matched_official);
        setSelectedOfficialId(data.matched_official.user_id);
        setValue('assigned_official_id', data.matched_official.user_id);
      }
      
      setAlternativeOfficials(data.alternatives || []);
      
      toast({
        title: "Official Matched!",
        description: data.matched_official 
          ? `Found ${data.matched_official.full_name} for your area`
          : "No exact match found, but you can manually select an official",
      });
      
    } catch (error) {
      console.error('Official matching failed:', error);
      toast({
        title: "Matching Failed",
        description: "Could not match officials for your area",
        variant: "destructive"
      });
    } finally {
      setIsMatching(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setMediaFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const selectOfficial = (officialId: string) => {
    setSelectedOfficialId(officialId);
    setValue('suggested_official_id', officialId);
    
    const selected = [matchedOfficial, ...alternativeOfficials].find(o => o?.user_id === officialId);
    if (selected) {
      toast({
        title: "Official Selected",
        description: `${selected.full_name} has been selected for this issue`,
      });
    }
  };

  const onSubmit = async (data: IssueFormData) => {
    if (!location) {
      toast({
        title: "Location required",
        description: "Please select a location for your issue",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to report an issue",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload media files if any
      let mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        // In production, upload to Supabase Storage
        mediaUrls = mediaFiles.map(file => file.name);
      }

      // Get user profile for notifications
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_id', user.id)
        .single();

      // Insert issue into database
      const { data: newIssue, error } = await supabase
        .from('issues')
        .insert({
          title: data.title,
          description: data.description,
          issue_type: data.issue_type,
          latitude: location.latitude,
          longitude: location.longitude,
          address: data.address || location.address,
          city: data.city,
          state: data.state,
          district: data.district,
          ward: data.ward,
          pincode: data.pincode,
          media_urls: mediaUrls,
          user_id: user.id,
          assigned_official_id: selectedOfficialId || matchedOfficial?.user_id,
          suggested_official_id: data.suggested_official_id
        })
        .select()
        .single();

      if (error) throw error;

      // Send notifications
      try {
        const { data: notificationResult, error } = await supabase.functions.invoke('send-notifications', {
          body: {
            issueId: newIssue.id,
            issueTitle: data.title,
            issueType: data.issue_type,
            location: {
              city: data.city,
              state: data.state,
              ward: data.ward,
              area: data.area,
              pincode: data.pincode
            },
            assignedOfficialId: selectedOfficialId || matchedOfficial?.user_id,
            citizenPhone: userProfile?.phone
          }
        });
        
        if (error) {
          console.error('Failed to send notifications:', error);
        }
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
      }

      toast({
        title: "Issue reported successfully!",
        description: matchedOfficial 
          ? `Your issue has been assigned to ${matchedOfficial.full_name}`
          : "Your issue has been submitted and will be reviewed soon.",
      });

      // Reset form
      setLocation(null);
      setMediaFiles([]);
      setMatchedOfficial(null);
      setAlternativeOfficials([]);
      setSelectedOfficialId('');
      setShowManualSelection(false);
      if (marker.current) marker.current.remove();
      
      // Reset form fields
      setValue('title', '');
      setValue('description', '');
      setValue('address', '');
      setValue('area', '');
      setValue('city', '');
      setValue('state', '');
      setValue('pincode', '');
      setValue('ward', '');
      setValue('district', '');

    } catch (error) {
      console.error('Error submitting issue:', error);
      toast({
        title: "Error",
        description: "Failed to submit your issue. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">🇮🇳 Report a Civic Issue</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Issue Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Brief description of the issue"
              />
              {errors.title && (
                <p className="text-destructive text-sm">{errors.title.message}</p>
              )}
            </div>

            {/* Issue Type */}
            <div className="space-y-2">
              <Label htmlFor="issue_type">Issue Type *</Label>
              <Select onValueChange={(value) => setValue('issue_type', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="road">🛣️ Road & Infrastructure</SelectItem>
                  <SelectItem value="water">💧 Water Supply</SelectItem>
                  <SelectItem value="electricity">⚡ Electricity</SelectItem>
                  <SelectItem value="garbage">🗑️ Garbage & Waste</SelectItem>
                  <SelectItem value="streetlight">💡 Street Lighting</SelectItem>
                  <SelectItem value="sewage">🚰 Sewage & Drainage</SelectItem>
                  <SelectItem value="other">📝 Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.issue_type && (
                <p className="text-destructive text-sm">{errors.issue_type.message}</p>
              )}
            </div>

            {/* Issue Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Provide detailed information about the issue..."
                rows={4}
              />
              {errors.description && (
                <p className="text-destructive text-sm">{errors.description.message}</p>
              )}
            </div>

            {/* Location Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Issue Location *</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={isLoadingLocation}
                >
                  {isLoadingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  Use Current Location
                </Button>
              </div>
              
              <div 
                ref={mapContainer} 
                className="h-64 w-full rounded-lg border"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Street address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Area *</Label>
                  <Input
                    id="area"
                    {...register('area')}
                    placeholder="Area/Locality"
                  />
                  {errors.area && (
                    <p className="text-destructive text-sm">{errors.area.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="City"
                  />
                  {errors.city && (
                    <p className="text-destructive text-sm">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    {...register('state')}
                    placeholder="State"
                  />
                  {errors.state && (
                    <p className="text-destructive text-sm">{errors.state.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    {...register('pincode')}
                    placeholder="6-digit pincode"
                    maxLength={6}
                  />
                  {errors.pincode && (
                    <p className="text-destructive text-sm">{errors.pincode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ward">Ward/Zone</Label>
                  <Input
                    id="ward"
                    {...register('ward')}
                    placeholder="Ward or Zone"
                  />
                </div>
              </div>
            </div>

            {/* AI-Assisted Official Matching */}
            {isMatching && (
              <Card className="border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>🤖 Finding the best official for your location...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {matchedOfficial && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    🎯 Best Match Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{matchedOfficial.full_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {matchedOfficial.location.area && `${matchedOfficial.location.area}, `}
                            {matchedOfficial.location.city}, {matchedOfficial.location.state}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-semibold">{matchedOfficial.score}% Match</span>
                        </div>
                        <Badge variant="secondary" className="mt-1">Auto-Selected</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Match Reasons:</p>
                      <div className="flex flex-wrap gap-1">
                        {matchedOfficial.match_reasons.map((reason, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {alternativeOfficials.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Info className="h-5 w-5 mr-2" />
                      Alternative Officials
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowManualSelection(!showManualSelection)}
                    >
                      {showManualSelection ? 'Hide' : 'Show'} Alternatives
                    </Button>
                  </div>
                </CardHeader>
                {showManualSelection && (
                  <CardContent>
                    <div className="space-y-3">
                      {alternativeOfficials.map((official) => (
                        <div
                          key={official.user_id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedOfficialId === official.user_id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => selectOfficial(official.user_id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <h5 className="font-medium">{official.full_name}</h5>
                                <p className="text-sm text-muted-foreground">
                                  {official.location.city}, {official.location.state}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center">
                                <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                <span className="text-sm">{official.score}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Media Upload */}
            <div className="space-y-4">
              <Label>Upload Photos/Videos</Label>
              <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="media"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="media" className="cursor-pointer">
                  <div className="flex flex-col items-center space-y-2">
                    <Camera className="h-8 w-8 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload photos or videos
                    </p>
                  </div>
                </label>
              </div>

              {mediaFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Files:</p>
                  {mediaFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-primary/5 p-2 rounded">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting Issue...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Issue Report
                </>
              )}
            </Button>

            {location && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>📍 Selected Location:</strong> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  <br />
                  {matchedOfficial && (
                    <>
                      <strong>👤 Assigned Official:</strong> {matchedOfficial.full_name}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};