import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays } from 'date-fns';
import { Mic2, Clock, Calendar, CheckCircle, Music, Headphones, Sliders } from 'lucide-react';
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "sonner";
import { motion } from 'framer-motion';

const timeSlots = [
  { value: '09:00-12:00', label: '9:00 AM - 12:00 PM', price: 150 },
  { value: '12:00-15:00', label: '12:00 PM - 3:00 PM', price: 150 },
  { value: '15:00-18:00', label: '3:00 PM - 6:00 PM', price: 175 },
  { value: '18:00-21:00', label: '6:00 PM - 9:00 PM', price: 200 },
  { value: '21:00-00:00', label: '9:00 PM - 12:00 AM', price: 175 },
];

const features = [
  { icon: Mic2, title: 'Professional Mics', description: 'Neumann, AKG, Shure collection' },
  { icon: Music, title: 'Instruments', description: 'Guitars, keyboards, drums' },
  { icon: Headphones, title: 'Monitoring', description: 'Studio headphones & speakers' },
  { icon: Sliders, title: 'Pro Equipment', description: 'Industry-standard mixing consoles' },
];

export default function StudioBooking() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    contact_number: '',
    email: '',
    address: '',
    time_slot: '',
    duration: '3 hours',
    payment_method: 'credit_card',
  });

  const bookingMutation = useMutation({
    mutationFn: (data) => base44.entities.StudioBooking.create(data),
    onSuccess: () => {
      toast.success('Studio booked successfully! Check your email for confirmation.');
      setFormData({
        customer_name: '',
        contact_number: '',
        email: '',
        address: '',
        time_slot: '',
        duration: '3 hours',
        payment_method: 'credit_card',
      });
      setSelectedDate(null);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDate || !formData.time_slot || !formData.customer_name || !formData.contact_number) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedSlot = timeSlots.find(s => s.value === formData.time_slot);
    
    bookingMutation.mutate({
      ...formData,
      booking_date: format(selectedDate, 'yyyy-MM-dd'),
      amount: selectedSlot?.price || 150,
    });
  };

  const selectedSlot = timeSlots.find(s => s.value === formData.time_slot);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-fuchsia-50 to-pink-50 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-200/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200/50 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-fuchsia-600 font-semibold text-sm tracking-wider uppercase mb-4">
                Recording Studio
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                Book Your
                <span className="block bg-gradient-to-r from-fuchsia-600 to-pink-500 bg-clip-text text-transparent">
                  Studio Session
                </span>
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                State-of-the-art recording facilities with professional-grade equipment. 
                Perfect for artists, bands, and content creators.
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg shadow-fuchsia-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center mb-3">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-fuchsia-200">
                <img 
                  src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=500&fit=crop"
                  alt="Recording Studio"
                  className="w-full h-80 object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
          >
            <div className="p-8 bg-gradient-to-r from-fuchsia-600 to-pink-500">
              <h2 className="text-2xl font-bold text-white">Book Your Session</h2>
              <p className="text-fuchsia-100">Fill in the details below to reserve your studio time</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Calendar */}
                <div>
                  <Label className="text-lg font-semibold mb-4 block">Select Date *</Label>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || date < addDays(new Date(), 1)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <Label className="text-lg font-semibold mb-4 block">Select Time Slot *</Label>
                  <div className="space-y-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setFormData({...formData, time_slot: slot.value})}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                          formData.time_slot === slot.value
                            ? 'border-fuchsia-500 bg-fuchsia-50'
                            : 'border-slate-200 hover:border-fuchsia-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className={`w-5 h-5 ${formData.time_slot === slot.value ? 'text-fuchsia-600' : 'text-slate-400'}`} />
                          <span className="font-medium">{slot.label}</span>
                        </div>
                        <span className="font-bold text-fuchsia-600">${slot.price}</span>
                      </button>
                    ))}
                  </div>
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
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter email"
                      className="mt-2 h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <Select 
                      value={formData.payment_method} 
                      onValueChange={(v) => setFormData({...formData, payment_method: v})}
                    >
                      <SelectTrigger className="mt-2 h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">Credit/Debit Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="net_banking">Net Banking</SelectItem>
                        <SelectItem value="cash">Pay at Studio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {selectedDate && formData.time_slot && (
                <div className="bg-gradient-to-r from-fuchsia-50 to-pink-50 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Booking Summary</h3>
                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium text-slate-900">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-medium text-slate-900">{selectedSlot?.label}</span>
                    </div>
                    <div className="flex justify-between pt-4 border-t border-fuchsia-200">
                      <span className="font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-fuchsia-600">${selectedSlot?.price}</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={bookingMutation.isPending}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-700 hover:to-pink-600 rounded-xl py-6 text-lg"
              >
                {bookingMutation.isPending ? 'Processing...' : 'Confirm Booking'}
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}