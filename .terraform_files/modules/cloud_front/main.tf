resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = var.prefix
  description                       = ""
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "cloudfront_frontend" {
  origin {
    domain_name              = "${var.bucket_name}.s3.${var.region}.amazonaws.com"
    origin_id                = var.bucket_name
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  retain_on_delete = true
  enabled          = true
  is_ipv6_enabled  = true
  comment          = "${var.prefix} CloudFront Distribution"
  price_class      = var.cf_price_class
  aliases          = ["${var.domain_name}"]

  default_cache_behavior {
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = var.bucket_name
    viewer_protocol_policy = "redirect-to-https"
  }

  default_root_object = "index.html"

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn_frontend
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SPA routing: redirect 403/404 to index.html so React Router works
  custom_error_response {
    error_code            = 403
    error_caching_min_ttl = 10
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_code            = 404
    error_caching_min_ttl = 10
    response_code         = 200
    response_page_path    = "/index.html"
  }
}
