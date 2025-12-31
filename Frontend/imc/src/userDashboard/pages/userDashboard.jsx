import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { 
  Calendar, Mic2, Music, Camera, Speaker, Users,
  Clock, MapPin, ChevronRight, Ticket
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: studioBookings = [], isLoading: loadingStudio } = useQuery({
    queryKey: ['my-studio-bookings', user?.email],
    queryFn: () => base44.entities.StudioBooking.filter({ created_by: user.email }, '-created_date', 5),
    enabled: !!user?.email,
  });

  const { data: eventBookings = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['my-event-bookings', user?.email],
    queryFn: () => base44.entities.EventBooking.filter({ created_by: user.email }, '-created_date', 5),
    enabled: !!user?.email,
  });

  const { data: classAdmissions = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['my-class-admissions', user?.email],
    queryFn: () => base44.entities.SingingClass.filter({ created_by: user.email }, '-created_date', 5),
    enabled: !!user?.email,
  });

  const quickActions = [
    { title: 'Book Studio', icon: Mic2, page: 'StudioBooking', color: 'from-fuchsia-500 to-pink-500' },
    { title: 'Browse Events', icon: Calendar, page: 'Events', color: 'from-orange-500 to-red-500' },
    { title: 'Singing Classes', icon: Users, page: 'SingingClasses', color: 'from-blue-500 to-cyan-500' },
    { title: 'Private Booking', icon: Music, page: 'PrivateBooking', color: 'from-emerald-500 to-teal-500' },
    { title: 'Media Services', icon: Camera, page: 'MediaServices', color: 'from-pink-500 to-rose-500' },
    { title: 'Sound Services', icon: Speaker, page: 'SoundServices', color: 'from-amber-500 to-yellow-500' },
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    enrolled: 'bg-green-100 text-green-700',
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {user.full_name || 'Music Lover'}! 👋
          </h1>
          <p className="text-slate-600 mt-2">Manage your bookings and explore our services</p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <Link key={action.page} to={createPageUrl(action.page)}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300 group cursor-pointer border border-slate-100 hover:border-violet-200"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-medium text-slate-900 group-hover:text-violet-600 transition-colors">
                    {action.title}
                  </h3>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Bookings Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Studio Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
          >
            <div className="p-6 bg-gradient-to-r from-fuchsia-500 to-pink-500">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Studio Bookings</h3>
                <Mic2 className="w-6 h-6 text-white/80" />
              </div>
            </div>
            <div className="p-6">
              {loadingStudio ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
              ) : studioBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Mic2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No studio bookings yet</p>
                  <Link to={createPageUrl('StudioBooking')}>
                    <Button className="mt-4" size="sm">Book Now</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {studioBookings.map(booking => (
                    <div key={booking.id} className="bg-slate-50 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(booking.booking_date), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 text-sm mt-1">
                            <Clock className="w-4 h-4" />
                            {booking.time_slot}
                          </div>
                        </div>
                        <Badge className={statusColors[booking.status] || 'bg-slate-100'}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Event Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
          >
            <div className="p-6 bg-gradient-to-r from-orange-500 to-red-500">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Event Tickets</h3>
                <Ticket className="w-6 h-6 text-white/80" />
              </div>
            </div>
            <div className="p-6">
              {loadingEvents ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
              ) : eventBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No event tickets yet</p>
                  <Link to={createPageUrl('Events')}>
                    <Button className="mt-4" size="sm">Browse Events</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventBookings.map(booking => (
                    <div key={booking.id} className="bg-slate-50 rounded-xl p-4">
                      <h4 className="font-medium text-slate-900">{booking.event_name}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-sm text-slate-600">
                          {booking.number_of_tickets} ticket{booking.number_of_tickets > 1 ? 's' : ''}
                        </div>
                        <Badge className={statusColors[booking.booking_status] || 'bg-slate-100'}>
                          {booking.booking_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Class Admissions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
          >
            <div className="p-6 bg-gradient-to-r from-blue-500 to-cyan-500">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Singing Classes</h3>
                <Users className="w-6 h-6 text-white/80" />
              </div>
            </div>
            <div className="p-6">
              {loadingClasses ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
              ) : classAdmissions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Not enrolled in any class</p>
                  <Link to={createPageUrl('SingingClasses')}>
                    <Button className="mt-4" size="sm">Enroll Now</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {classAdmissions.map(admission => (
                    <div key={admission.id} className="bg-slate-50 rounded-xl p-4">
                      <h4 className="font-medium text-slate-900">
                        {admission.first_name} {admission.last_name}
                      </h4>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-sm text-slate-600 capitalize">
                          {admission.preferred_batch} batch
                        </div>
                        <Badge className={statusColors[admission.status] || 'bg-slate-100'}>
                          {admission.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}