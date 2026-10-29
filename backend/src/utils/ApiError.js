class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

class GoalBalanceError extends ApiError {
  constructor(message) {
    super(message, 400);
    this.name = "GoalBalanceError";
  }
}

module.exports = {
  ApiError,
  GoalBalanceError,
};
