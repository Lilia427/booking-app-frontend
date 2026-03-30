resource "aws_s3_bucket" "codebase" {
  bucket = "${var.prefix}-codebase"

  tags = var.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "s3_encryption" {
  bucket = aws_s3_bucket.codebase.id
  rule {
    bucket_key_enabled = true
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
