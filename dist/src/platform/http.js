export function asyncHandler(fn) {
    return (req, res, next) => {
        void fn(req, res, next).catch(next);
    };
}
export function ok(res, data, status = 200) {
    res.status(status).json({ data });
}
//# sourceMappingURL=http.js.map