import userRoutes from '../routes/userRoutes.js';
import carRoutes from '../routes/carRoutes.js'; 
import subscriptionRoutes from '../routes/subscriptionRoutes.js';


export default (app) => {

app.use('/api/users', userRoutes); 
app.use('/api/cars', carRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

}