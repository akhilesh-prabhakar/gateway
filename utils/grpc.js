const { grpc } = require("../grpc/clients");

function grpcStatusToHttp(code) {
  switch (code) {
    case grpc.status.INVALID_ARGUMENT:
      return 400;
    case grpc.status.UNAUTHENTICATED:
      return 401;
    case grpc.status.PERMISSION_DENIED:
      return 403;
    case grpc.status.NOT_FOUND:
      return 404;
    case grpc.status.ALREADY_EXISTS:
      return 409;
    case grpc.status.FAILED_PRECONDITION:
      return 412;
    default:
      return 500;
  }
}

function handleGrpcError(res, error) {
  const status = grpcStatusToHttp(error.code);
  const message = error.message || "Upstream service error";
  console.log(error);
  return res.status(status).json({ message });
}

module.exports = { handleGrpcError };
