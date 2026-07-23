output "api_url" {
  value = "https://${aws_cloudfront_distribution.api.domain_name}"
}

output "web_url" {
  value = "https://${aws_cloudfront_distribution.web.domain_name}"
}

output "ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.api.name
}

output "web_s3_bucket" {
  value = aws_s3_bucket.web.bucket
}

output "web_cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.web.id
}

output "spotify_redirect_uri" {
  description = "Register this exact URI in the Spotify Developer Dashboard for this app"
  value       = "https://${aws_cloudfront_distribution.api.domain_name}/auth/spotify/callback"
}
