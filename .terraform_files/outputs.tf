output "region" {
  value = local.region
}

output "terraform_workspace" {
  value = terraform.workspace
}

output "project_name" {
  value = var.project_name
}

output "common_tags" {
  value = local.common_tags
}
