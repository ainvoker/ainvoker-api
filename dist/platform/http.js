class Http {
    asyncHandler(fn) {
        return (req, res, next) => {
            void fn(req, res, next).catch(next);
        };
    }
    ok(res, data, status = 200) {
        res.status(status).json({ data });
    }
}
export default new Http();
//# sourceMappingURL=http.js.map