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
import { MapPin, Camera, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

export const IssueReportForm = () => {
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

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
      // Note: In production, you would use Mapbox geocoding API
      // For now, we'll set basic location data
      const locationData: LocationData = {
        latitude: lat,
        longitude: lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        area: 'Area Name', // This would come from reverse geocoding
        city: 'Delhi', // This would come from reverse geocoding
        state: 'Delhi',
        pincode: '110001', // This would come from reverse geocoding
        ward: 'Ward 1' // This would come from reverse geocoding
      };
      
      // Update form fields with geocoded data
      setValue('address', locationData.address);
      setValue('area', locationData.area!);
      setValue('city', locationData.city!);
      setValue('state', locationData.state!);
      setValue('pincode', locationData.pincode!);
      setValue('ward', locationData.ward!);
      
      setLocation(locationData);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
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

  const onSubmit = async (data: IssueFormData) => {
    if (!location) {
      toast({
        title: "Location required",
        description: "Please select a location for your issue",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please login to report an issue",
          variant: "destructive"
        });
        return;
      }

      // Upload media files if any
      let mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        // In production, you would upload to Supabase Storage
        // For now, we'll just store file names
        mediaUrls = mediaFiles.map(file => file.name);
      }

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
          ward: data.ward,
          media_urls: mediaUrls,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Notify officials in the area
      try {
        const { data: notificationResult, error } = await supabase.functions.invoke('notify-officials', {
          body: {
            issueId: newIssue.id,
            issueTitle: data.title,
            issueType: data.issue_type,
            location: {
              city: data.city,
              state: data.state,
              ward: data.ward,
              area: data.area
            }
          }
        });
        
        if (error) {
          console.error('Failed to notify officials:', error);
        }
      } catch (notificationError) {
        console.error('Failed to notify officials:', notificationError);
        // Don't fail the entire request if notification fails
      }

      toast({
        title: "Issue reported successfully!",
        description: "Your issue has been submitted and will be reviewed soon.",
      });

      // Reset form
      setLocation(null);
      setMediaFiles([]);
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
          <CardTitle className="text-govt-blue">Report a Civic Issue</CardTitle>
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
                className="border-govt-blue/20"
              />
              {errors.title && (
                <p className="text-destructive text-sm">{errors.title.message}</p>
              )}
            </div>

            {/* Issue Type */}
            <div className="space-y-2">
              <Label htmlFor="issue_type">Issue Type *</Label>
              <Select onValueChange={(value) => setValue('issue_type', value as any)}>
                <SelectTrigger className="border-govt-blue/20">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="road">Road & Infrastructure</SelectItem>
                  <SelectItem value="water">Water Supply</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="garbage">Garbage & Waste</SelectItem>
                  <SelectItem value="streetlight">Street Lighting</SelectItem>
                  <SelectItem value="sewage">Sewage & Drainage</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
                className="border-govt-blue/20"
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
                  className="border-govt-blue text-govt-blue hover:bg-govt-blue hover:text-white"
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
                className="h-64 w-full rounded-lg border border-govt-blue/20"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Street address"
                    className="border-govt-blue/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Area *</Label>
                  <Input
                    id="area"
                    {...register('area')}
                    placeholder="Area/Locality"
                    className="border-govt-blue/20"
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
                    className="border-govt-blue/20"
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
                    className="border-govt-blue/20"
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
                    className="border-govt-blue/20"
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
                    className="border-govt-blue/20"
                  />
                </div>
              </div>
              
              {location && (
                <div className="text-sm text-muted-foreground bg-govt-blue/5 p-3 rounded">
                  <p><strong>Selected Coordinates:</strong> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                  <p className="text-xs mt-1">You can click on the map to change the location or fill the address manually</p>
                </div>
              )}
            </div>

            {/* Media Upload */}
            <div className="space-y-4">
              <Label>Upload Photos/Videos</Label>
              <div className="border-2 border-dashed border-govt-blue/20 rounded-lg p-6 text-center">
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
                    <Camera className="h-8 w-8 text-govt-blue" />
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
                    <div key={index} className="flex items-center justify-between bg-govt-blue/5 p-2 rounded">
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
              className="w-full bg-govt-saffron hover:bg-govt-saffron/90 text-white"
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
};