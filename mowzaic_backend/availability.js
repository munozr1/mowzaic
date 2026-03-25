import express from 'express';
import supabase from './db.js';
import { validateToken } from './middleware.js';
import { gen14days } from './utils.js';
import logger from './logger.js';

const router = express.Router();

// Get available dates for this week
router.get('/this-week', validateToken, async (req, res) => {
  try {
    // Get unavailable days from database
    const { data: unavailableDays, error: unavailableError } = await supabase
      .from('unavailable_days')
      .select('day');

    if (unavailableError) throw unavailableError;

    // Generate next 14 days
    const next14Days = gen14days();

    // Filter out unavailable days
    const availableDates = next14Days.filter(date => {
      const dayOfWeek = new Date(date).getDay();
      return !unavailableDays.some(day => day.day === dayOfWeek);
    });

    // Get bookings for the next 14 days
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('date')
      .gte('date', next14Days[0])
      .lte('date', next14Days[13]);

    if (bookingsError) throw bookingsError;

    // Count bookings per date
    const bookingsPerDate = {};
    bookings.forEach(booking => {
      bookingsPerDate[booking.date] = (bookingsPerDate[booking.date] || 0) + 1;
    });

    // Filter out dates with 10 or more bookings
    const finalAvailableDates = availableDates.filter(date => {
      return (bookingsPerDate[date] || 0) < 10;
    });

    res.json({ availableDates: finalAvailableDates });
  } catch (error) {
    logger.error('Error fetching available dates:', error);
    res.status(500).json({ error: 'Failed to fetch available dates' });
  }
});

export { router as availabilityRoutes }; 
