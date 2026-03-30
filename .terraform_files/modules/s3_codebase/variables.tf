variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
}

variable "prefix" {
  description = "Prefix to be applied to all resources"
  type        = string
}

variable "cloudfront_frontend_arn" {
  description = "ARN of the CloudFront distribution allowed to read from this bucket"
  type        = string
}
