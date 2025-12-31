import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Music2, Users, Clock, Calendar, Star, Check, 
  Loader2, CheckCircle, Sun, Moon, Sunset
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const batches = [
  { id: 'morning', label: 'Morning Batch', time: '7:00 AM - 9:00 AM', icon: Sun, days: 'Mon, Wed, Fri' },
  { id: 'afternoon', label: 'Afternoon Batch', time: '2:00 PM - 4:00 PM', icon: Sunset, days: 'Mon, Wed, Fri' },
  { id: 'evening', label: 'Evening Batch', time: '6:00 PM - 8:00 PM', icon: Moon, days: 'Mon, Wed, Fri' },
  { id: 'weekend', label: 'Weekend Batch', time: '10:00 AM - 1:00 PM', icon: Calendar, days: 'Sat, Sun' },
];

const plans = [
  {
    name: 'Beginner',
    duration: '3 Months',
    price: 5000,
    features: ['Basic vocal training', 'Breathing techniques', 'Rhythm & pitch', 'Group sessions'],
    popular: false
  },
  {
    name: 'Intermediate',
    duration: '6 Months',
    price: 9000,
    features: ['Advanced techniques', 'Song interpretation', 'Stage presence', 'Recording sessions', 'Performance opportunities'],
    popular: true
  },
  {
    name: 'Professional',
    duration: '12 Months',
    price: 16000,
    features: ['Master-level training', 'Personal mentoring', 'Album recording', 'Live performances', 'Industry connections', 'Certificate'],
    popular: false
  }
];

const instructors = [
  {
    name: 'Rajesh Kumar',
    specialty: 'Classical & Bollywood',
    experience: '15 years',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'
  },
  {
    name: 'Priya Sharma',
    specialty: 'Western & Pop',
    experience: '10 years',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
  },
  {
    name: 'Amit Verma',
    specialty: 'Rock & Metal',
    experience: '12 years',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
  }
];

export default function SingingClasses() {
  const [showForm, setShowForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    preferred_batch: '',
    reference_by: ''
  });
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);

  const enrollMutation = useMutation({
    mutationFn: (data) => base44.entities.SingingClass.create(data),
    onSuccess: () => {
      setEnrollmentSuccess(true);
      toast.success("Enrollment successful!");
    },
    onError: () => {
      toast.error("Enrollment failed. Please try again.");
    }
  });

  const handleEnroll = () => {
    if (!formData.first_name || !formData.phone || !formData.preferred_batch) {
      toast.error("Please fill in all required fields");
      return;
    }

    enrollMutation.mutate({
      ...formData,
      fee_paid: selectedPlan?.price || 0,
      status: 'pending'
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedPlan(null);
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      street_address: '',
      city: '',
      state: '',
      postal_code: '',
      preferred_batch: '',
      reference_by: ''
    });
    setEnrollmentSuccess(false);
  };

  if (enrollmentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 pb-20">
        <div className="max-w-xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Enrollment Successful!</h2>
              <p className="text-gray-600 mb-2">Welcome to IMC Singing Classes!</p>
              <p className="text-gray-500 text-sm mb-8">
                Our team will contact you shortly with class details and payment information.
              </p>
              <Button onClick={resetForm} className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600">
                Back to Classes
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-rose-900 via-pink-800 to-purple-900 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img
            src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1920"
            alt="Singing"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
              Learn from the Best
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Singing Classes</h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Discover your voice with professional vocal training from industry experts
            </p>
          </motion.div>
        </div>
      </section>

      {!showForm ? (
        <>
          {/* Batches */}
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="text-3xl font-bold text-center mb-12">Available Batches</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {batches.map((batch) => (
                    <Card key={batch.id} className="p-6 text-center hover:shadow-lg transition-shadow">
                      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <batch.icon className="w-8 h-8 text-amber-600" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{batch.label}</h3>
                      <p className="text-amber-600 font-semibold mb-1">{batch.time}</p>
                      <p className="text-gray-500 text-sm">{batch.days}</p>
                    </Card>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Pricing Plans */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="text-3xl font-bold text-center mb-4">Choose Your Plan</h2>
                <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                  Select a plan that fits your goals and schedule
                </p>
                <div className="grid md:grid-cols-3 gap-8">
                  {plans.map((plan, idx) => (
                    <Card 
                      key={idx} 
                      className={`p-8 relative overflow-hidden ${plan.popular ? 'ring-2 ring-amber-500 shadow-xl' : ''}`}
                    >
                      {plan.popular && (
                        <Badge className="absolute top-4 right-4 bg-amber-500">Most Popular</Badge>
                      )}
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-gray-500 mb-4">{plan.duration}</p>
                      <div className="mb-6">
                        <span className="text-4xl font-bold text-amber-600">₹{plan.price.toLocaleString()}</span>
                        <span className="text-gray-500">/course</span>
                      </div>
                      <ul className="space-y-3 mb-8">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-green-500" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        onClick={() => {
                          setSelectedPlan(plan);
                          setShowForm(true);
                        }}
                        className={`w-full rounded-full ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700' 
                            : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                      >
                        Enroll Now
                      </Button>
                    </Card>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Instructors */}
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="text-3xl font-bold text-center mb-12">Meet Our Instructors</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {instructors.map((instructor, idx) => (
                    <Card key={idx} className="p-6 text-center">
                      <img
                        src={instructor.image}
                        alt={instructor.name}
                        className="w-24 h-24 rounded-full object-cover mx-auto mb-4 ring-4 ring-amber-100"
                      />
                      <h3 className="font-bold text-xl mb-1">{instructor.name}</h3>
                      <p className="text-amber-600 font-medium mb-2">{instructor.specialty}</p>
                      <p className="text-gray-500 text-sm">{instructor.experience} experience</p>
                      <div className="flex justify-center mt-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
        </>
      ) : (
        /* Enrollment Form */
        <section className="py-16">
          <div className="max-w-2xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-8">
                <div className="mb-8">
                  <Button variant="ghost" onClick={() => setShowForm(false)} className="mb-4">
                    ← Back to Plans
                  </Button>
                  <h2 className="text-2xl font-bold">Enrollment Form</h2>
                  {selectedPlan && (
                    <p className="text-amber-600 font-medium">{selectedPlan.name} - ₹{selectedPlan.price.toLocaleString()}</p>
                  )}
                </div>

                <div className="grid gap-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+91 XXXXX XXXXX"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.street_address}
                      onChange={(e) => setFormData({...formData, street_address: e.target.value})}
                      className="mt-2"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postal">Postal Code</Label>
                      <Input
                        id="postal"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="batch">Preferred Batch *</Label>
                    <Select
                      value={formData.preferred_batch}
                      onValueChange={(value) => setFormData({...formData, preferred_batch: value})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select a batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.label} ({batch.time})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reference">Reference By (Optional)</Label>
                    <Input
                      id="reference"
                      value={formData.reference_by}
                      onChange={(e) => setFormData({...formData, reference_by: e.target.value})}
                      placeholder="Who referred you?"
                      className="mt-2"
                    />
                  </div>

                  <Button
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 py-6 text-lg rounded-full"
                  >
                    {enrollMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Submit Enrollment'
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}