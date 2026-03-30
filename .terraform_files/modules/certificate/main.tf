# ACM certificate MUST be in us-east-1 for CloudFront — AWS requirement
resource "aws_acm_certificate" "cert_frontend" {
  domain_name               = var.root_domain_name
  subject_alternative_names = ["*.${var.root_domain_name}"]
  validation_method         = "DNS"
  tags                      = var.common_tags
  provider                  = aws.certificate

  lifecycle {
    create_before_destroy = true
  }
}

provider "aws" {
  shared_config_files = ["/home/circleci/project/config"]
  region              = "us-east-1"
  profile             = "booking-frontend"
  alias               = "certificate"
}
