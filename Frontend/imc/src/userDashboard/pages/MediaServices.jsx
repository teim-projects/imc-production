import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays } from 'date-fns';
import { Camera, Video, CheckCircle, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { motion } from 'framer-motion';

const packages = [
  {
    name: 'Basic',
    price: 200,
    features: ['2 hours coverage', '50 edited photos', 'Online gallery', 'Digital delivery'],
    color: 'from-slate-500 to-slate-600'
  },
  {
    name: 'Standard',
    price: 450,
    popular: true,
    features: ['4 hours coverage', '150 edited photos', '5 min highlight video', 'Online gallery', 'USB delivery'],
    color: 'from-pink-500 to-rose-500'
  },
  {
    name: 'Premium',
    price: 800,
    features: ['Full day coverage', 'Unlimited photos', '15 min documentary', 'Drone footage', 'Album included', 'Same-day edit'],
    color: 'from-violet-500 to-purple-600'
  },
];

const portfolio = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=400&h=300&fit=crop',
];

export default function MediaServices() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    contact_number: '',
    email: '',
    service_type: 'both',
    event_location: '',
    duration: '',
    special_requirements: '',
  });

  const bookingMutation = useMutation({
    mutationFn: (data) => base44.entities.MediaService.create(data),
    onSuccess: () => {
      toast.success('Booking request submitted! We will contact you shortly.');
      setFormData({
        customer_name: '',
        contact_number: '',
        email: '',
        service_type: 'both',
        event_location: '',
        duration: '',
        special_requirements: '',
      });
      setSelectedDate(null);
      setSelectedPackage(null);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.contact_number || !selectedDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    bookingMutation.mutate({
      ...formData,
      event_date: format(selectedDate, 'yyyy-MM-dd'),
      package: selectedPackage?.name?.toLowerCase(),
      amount: selectedPackage?.price || 0,
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-pink-50 to-rose-50 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-200/50 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="inline-block text-pink-600 font-semibold text-sm tracking-wider uppercase mb-4">
                Photography & Videography
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                Capture Your
                <span className="block bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
                  Precious Moments
                </span>
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                Professional photography and videography services for events, music videos, 
                album artwork, and special occasions.
              </p>

              <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg">
                  <Camera className="w-5 h-5 text-pink-600" />
                  <span className="font-medium">Photography</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg">
                  <Video className="w-5 h-5 text-rose-600" />
                  <span className="font-medium">Videography</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              {portfolio.slice(0, 4).map((image, index) => (
                <div
                  key={index}
                  className={`rounded-2xl overflow-hidden shadow-lg ${
                    index === 0 ? 'col-span-2' : ''
                  }`}
                >
                  <img 
                    src={image} 
                    alt={`Portfolio ${index + 1}`}
                    className={`w-full object-cover ${index === 0 ? 'h-48' : 'h-32'}`}
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Choose Your Package</h2>
            <p className="text-slate-600">Select the package that best fits your needs</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative cursor-pointer rounded-3xl p-8 transition-all duration-300 h-full ${
                    selectedPackage?.name === pkg.name
                      ? 'bg-gradient-to-br ' + pkg.color + ' text-white shadow-2xl scale-105'
                      : 'bg-white border border-slate-200 hover:shadow-xl hover:border-pink-200'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className={`text-2xl font-bold mb-2 ${selectedPackage?.name === pkg.name ? 'text-white' : 'text-slate-900'}`}>
                      {pkg.name}
                    </h3>
                    <div className={`text-4xl font-bold ${selectedPackage?.name === pkg.name ? 'text-white' : 'text-pink-600'}`}>
                      ${pkg.price}
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className={`w-5 h-5 flex-shrink-0 ${
                          selectedPackage?.name === pkg.name ? 'text-white' : 'text-green-500'
                        }`} />
                        <span className={selectedPackage?.name === pkg.name ? 'text-white/90' : 'text-slate-600'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full mt-6 rounded-xl ${
                      selectedPackage?.name === pkg.name
                        ? 'bg-white text-pink-600 hover:bg-white/90'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600'
                    }`}
                  >
                    {selectedPackage?.name === pkg.name ? 'Selected' : 'Select Package'}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden"
          >
            <div className="p-8 bg-gradient-to-r from-pink-600 to-rose-500">
              <h2 className="text-2xl font-bold text-white">Book Your Session</h2>
              <p className="text-pink-100">Fill in the details below</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Calendar */}
                <div>
                  <Label className="text-lg font-semibold mb-4 block">Select Date *</Label>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < addDays(new Date(), 3)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-6">
                  <div>
                    <Label>Service Type</Label>
                    <Select 
                      value={formData.service_type} 
                      onValueChange={(v) => setFormData({...formData, service_type: v})}
                    >
                      <SelectTrigger className="mt-2 h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photography">Photography Only</SelectItem>
                        <SelectItem value="videography">Videography Only</SelectItem>
                        <SelectItem value="both">Both Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Event Location *</Label>
                    <Input
                      value={formData.event_location}
                      onChange={(e) => setFormData({...formData, event_location: e.target.value})}
                      placeholder="Where is your event?"
                      className="mt-2 h-12 rounded-xl"
                    />
                  </div>

                  {selectedPackage && (
                    <div className="bg-pink-50 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-slate-600">Selected Package</div>
                          <div className="font-bold text-lg">{selectedPackage.name}</div>
                        </div>
                        <div className="text-2xl font-bold text-pink-600">
                          ${selectedPackage.price}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="pt-8 border-t border-slate-200">
                <h3 className="text-lg font-semibold mb-6">Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                      placeholder="Enter your name"
                      className="mt-2 h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      value={formData.contact_number}
                      onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                      placeholder="Enter phone number"
                      className="mt-2 h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter email"
                    className="mt-2 h-12 rounded-xl"
                  />
                </div>

                <div className="mt-6">
                  <Label>Special Requirements</Label>
                  <Textarea
                    value={formData.special_requirements}
                    onChange={(e) => setFormData({...formData, special_requirements: e.target.value})}
                    placeholder="Any special shots, styles, or requirements?"
                    className="mt-2 rounded-xl min-h-32"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={bookingMutation.isPending}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 rounded-xl py-6 text-lg"
              >
                {bookingMutation.isPending ? 'Submitting...' : 'Submit Booking Request'}
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}