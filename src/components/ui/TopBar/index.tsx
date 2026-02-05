import NavBar from '../NavBar';
import RightContent from './RightContent';
import { Wrapper } from './style';

const TopBar = () => {
  return (
    <Wrapper>
      <NavBar />
      <RightContent />
    </Wrapper>
  );
};

export default TopBar;
