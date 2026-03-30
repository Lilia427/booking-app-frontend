variable "project_name" {
  description = "booking"
  type        = string
}

variable "region" {
  description = "eu-north-1"
  type        = string
}

variable "domain_name" {}

variable "root_domain_name" {}

variable "cf_price_class" {
  description = "Price and regions of CloudFront distribution"
}
