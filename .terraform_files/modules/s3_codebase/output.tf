output "bucket_name" {
  value = aws_s3_bucket.codebase.id
}

output "bucket_arn" {
  value = aws_s3_bucket.codebase.arn
}
