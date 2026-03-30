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

resource "aws_s3_bucket_policy" "s3_policy" {
  bucket = aws_s3_bucket.codebase.bucket
  policy = <<EOF
    {
      "Version": "2008-10-17",
      "Id": "PolicyForCloudFrontPrivateContent",
      "Statement": [
          {
              "Sid": "AllowCloudFrontServicePrincipal",
              "Effect": "Allow",
              "Principal": {
                  "Service": "cloudfront.amazonaws.com"
              },
              "Action": "s3:GetObject",
              "Resource": "${aws_s3_bucket.codebase.arn}/*",
              "Condition": {
                  "StringEquals": {
                    "AWS:SourceArn": "${var.cloudfront_frontend_arn}"
                  }
              }
          }
      ]
    }
    EOF
}
