import { fetch } from '../index';


// POST /api/sales-order/count_pc
export default {
    getList: (params) =>
        fetch.post("/demo/list", params)
};
