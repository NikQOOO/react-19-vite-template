import { Breadcrumb } from 'antd';
import { Link } from 'react-router';

import { usePlatformStore } from '@/store/system/index.store';

import type { BreadcrumbItemType, BreadcrumbSeparatorType } from 'antd/es/breadcrumb/Breadcrumb';
import { NavbarWrapper } from './style';

const GlobalHeaderRight: React.FC = () => {
  const breadcrumbList = usePlatformStore((state) => state.breadcrumbList);

  const itemRender = (
    item: Partial<BreadcrumbItemType & BreadcrumbSeparatorType>,
    _: unknown,
    items: Partial<BreadcrumbItemType & BreadcrumbSeparatorType>[],
  ) => {
    const last = items.indexOf(item) === items.length - 1;
    return last ? <span>{item.title}</span> : <Link to={item.href || '/'}>{item.title}</Link>;
  };

  return (
    <NavbarWrapper>
      <Breadcrumb
        className="breadcrumb-wrapper"
        items={[
          ...breadcrumbList.map((item) => ({
            href: item.routePath,
            title: (
              <>
                {item.icon}
                <span>{item.title}</span>
              </>
            ),
          })),
        ]}
        itemRender={itemRender}
      />
    </NavbarWrapper>
  );
};
export default GlobalHeaderRight;
