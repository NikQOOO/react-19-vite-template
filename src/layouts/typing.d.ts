declare namespace Layout {
  interface ISideProps {
    collapse: boolean;
    setCollapse: (flag: boolean) => void;
  }
  interface ISideStyleProps {
    $collapse: string;
  }

  interface ITopBarProps {
    $collapse: string;
    $isShowHeaderLine: string;
  }
}
