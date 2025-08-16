import express from 'express';
import { UserRouter } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.route';
import { ParcelRoutes } from '../modules/parcel/parcel.route';
 

const router = express.Router();

const moduleRoutes = [
  
  {
    path: '/users',
    route: UserRouter,
  } ,{
    path: '/auth',
    route: AuthRoutes,
  } ,{
    path: '/parcels',
    route: ParcelRoutes,
  } 
   
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
