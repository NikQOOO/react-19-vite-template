import { Link, useRouteError } from 'react-router';

interface RouteError {
  data?: string;
  statusText?: string;
  message?: string;
}

const ErrorComponent = () => {
  const error = useRouteError() as RouteError;
  console.error(error);
  return (
    <div>
      <h1>Error Occurred</h1>
      <p>{error.data || error.statusText || error.message || 'Something went wrong!'}</p>
      <Link to="/">Go Back Home</Link>
    </div>
  );
};

export default ErrorComponent;
