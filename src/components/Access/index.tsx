interface IAccessProps {
  accessible: boolean;
  fallback: React.ReactNode;
  children: React.ReactNode;
}

const Access: React.FC<IAccessProps> = (props) => {
  const { accessible, fallback, children } = props;

  if (accessible) {
    return children;
  }

  return fallback;
};

export default Access;
