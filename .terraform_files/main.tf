// ================ main configurations ====================================
terraform {
  backend "s3" {
    profile              = "booking-frontend"
    bucket               = "booking-frontend-tfstate"
    workspace_key_prefix = "environments-frontend"
    key                  = "resources.tfstate"
    region               = "eu-north-1"
    encrypt              = true
  }
}

provider "aws" {
  shared_config_files = local.config_file
  region              = "eu-north-1"
  profile             = "booking-frontend"
  alias               = "booking-frontend"
}

provider "aws" {
  shared_config_files = local.config_file
  profile             = local.environment
  region              = local.region
}

locals {
  environment = terraform.workspace
  prefix      = "${terraform.workspace}-${var.project_name}"
  common_tags = {
    Environment = terraform.workspace
    ProjectName = var.project_name
    ManagedBy   = "terraform"
  }
  config_file = ["/home/circleci/project/config"]
  region      = var.region
}

// ================ resources from modules ==================================
module "certificate" {
  source           = "./modules/certificate"
  common_tags      = local.common_tags
  root_domain_name = var.root_domain_name
}

module "cloud_front" {
  source                       = "./modules/cloud_front"
  common_tags                  = local.common_tags
  prefix                       = local.prefix
  acm_certificate_arn_frontend = module.certificate.acm_certificate_arn_frontend
  project_name                 = var.project_name
  domain_name                  = var.domain_name
  region                       = var.region
  cf_price_class               = var.cf_price_class
  bucket_name                  = module.s3_codebase.bucket_name
}

module "s3_codebase" {
  source      = "./modules/s3_codebase"
  common_tags = local.common_tags
  prefix      = local.prefix
}

resource "aws_s3_bucket_policy" "codebase_policy" {
  bucket = module.s3_codebase.bucket_name
  policy = jsonencode({
    Version = "2008-10-17"
    Id      = "PolicyForCloudFrontPrivateContent"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${module.s3_codebase.bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = module.cloud_front.cloudfront_frontend_arn
          }
        }
      }
    ]
  })
}

module "secret_manager" {
  source       = "./modules/secret_manager"
  project_name = var.project_name
  common_tags  = local.common_tags
}
