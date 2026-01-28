declare namespace API {
  interface IRestModal<T> {
    code: number;
    msg: string;
    data: T;
  }

  interface IPagingRestModal<T> {
    code: number;
    msg: string;
    data: T;
    paging: {
      total_count: number;
      page_count: number;
      page_size: number;
      current_page: number;
    };
  }

  interface IRestInfo {
    code: number;
    msg: string;
  }

  interface IPaginated {
    page: number;
    page_size: number;
  }
}
