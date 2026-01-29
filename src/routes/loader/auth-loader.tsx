import { redirect } from 'react-router';

import { isAuthenticated } from './utils';

const AuthLoader = async () => {
  if (isAuthenticated()) {
    return redirect('/login');
  }

  return null;
};

export default AuthLoader;
