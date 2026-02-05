import { redirect } from 'react-router';

import { isAuthenticated } from './utils';

const AuthLoader = async () => {
  if (!isAuthenticated()) {
    return redirect('/401');
  }

  return null;
};

export default AuthLoader;
