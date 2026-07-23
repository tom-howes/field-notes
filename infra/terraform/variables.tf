variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "field-notes"
}

variable "db_name" {
  type    = string
  default = "field_notes"
}

variable "db_username" {
  type    = string
  default = "field_notes"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "spotify_client_id" {
  type      = string
  sensitive = true
}

variable "spotify_client_secret" {
  type      = string
  sensitive = true
}

variable "session_jwt_secret" {
  type      = string
  sensitive = true
}

variable "api_image_tag" {
  description = "Docker image tag in ECR to deploy for the api service"
  type        = string
  default     = "latest"
}

variable "api_cpu" {
  description = "Fargate task vCPU units (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "api_memory" {
  description = "Fargate task memory in MB"
  type        = number
  default     = 512
}
