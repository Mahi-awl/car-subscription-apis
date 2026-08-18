import cron from 'node-cron';
import Subscription from '../models/subscriptionModel.js';
import Car from '../models/carModel.js';

export const setupCronJobs = () => {

  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running Cron Job: Checking for expired subscriptions...');

      const currentDate = new Date();

      const expiredSubscriptions = await Subscription.find({
        status: 'active',
        endDate: { $lt: currentDate }
      });

      if (expiredSubscriptions.length === 0) {
        console.log('No expired subscriptions found.');
        return;
      }

      for (const sub of expiredSubscriptions) {
        sub.status = 'completed';
        await sub.save();

        const car = await Car.findById(sub.car);
        if (car) {
          car.isAvailable = true;
          await car.save();
        }

        console.log(`Car ${sub.car} is now available because subscription ${sub._id} expired.`);
      }

      console.log(`Cron Job executed successfully. Updated ${expiredSubscriptions.length} subscriptions.`);
    } catch (error) {
      console.error('CRON JOB ERROR =>', error);
    }
  });

  console.log('Cron jobs initialized successfully!');
};