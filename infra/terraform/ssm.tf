# Secrets referenced by the ECS task via `secrets` (valueFrom), not plain
# environment variables — keeps them out of `aws ecs describe-task-definition`
# output, which anyone with basic ECS read access could otherwise see.

resource "aws_ssm_parameter" "database_url" {
  name  = "/${var.project_name}/database_url"
  type  = "SecureString"
  value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.address}:5432/${var.db_name}"
}

resource "aws_ssm_parameter" "spotify_client_secret" {
  name  = "/${var.project_name}/spotify_client_secret"
  type  = "SecureString"
  value = var.spotify_client_secret
}

resource "aws_ssm_parameter" "session_jwt_secret" {
  name  = "/${var.project_name}/session_jwt_secret"
  type  = "SecureString"
  value = var.session_jwt_secret
}
