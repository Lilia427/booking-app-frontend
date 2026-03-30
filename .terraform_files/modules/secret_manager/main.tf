resource "aws_secretsmanager_secret" "secret_frontend" {
  name = "${terraform.workspace}/${var.project_name}/frontend"

  description = "Stores environment variables for ${terraform.workspace} ${var.project_name} frontend"
  tags        = var.common_tags
}
