/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import { expect, type Locator, type Page } from '@playwright/test';

import { BasePage } from './base-page';
import { McpReadyTabPage } from './mcp-ready-tab-page';

export class AddingMcpServerPage extends BasePage {
  readonly addingMcpServerHeading: Locator;
  readonly connectButton: Locator;
  readonly errorMessage: Locator;
  readonly mcpRemoteDetails: Locator;
  readonly mcpHeaders: Locator;

  constructor(page: Page, mcpServerName: string) {
    super(page);
    this.addingMcpServerHeading = this.page.getByRole('heading', { name: `Adding ${mcpServerName}` });
    this.connectButton = this.page.getByRole('button', { name: 'Connect' });
    this.errorMessage = this.page.getByRole('alert');
    this.mcpRemoteDetails = this.page.getByLabel('Remote MCP Definition');
    this.mcpHeaders = this.page.getByLabel('Headers');
  }

  async waitForLoad(): Promise<void> {
    await expect(this.addingMcpServerHeading).toBeVisible();
    await expect(this.mcpRemoteDetails).toBeVisible();
  }

  async fillInputFieldByLabel(label: string, data: string): Promise<void> {
    const input = this.page.getByLabel(label);
    await expect(input).toBeVisible();
    await expect(input).toBeEditable();
    await input.fill(data);
    await expect(input).toHaveValue(data);
  }

  async connectToRemoteMcpServer(): Promise<McpReadyTabPage> {
    try {
      await expect(this.connectButton).toBeEnabled();
      const mcpReadyTabPage = new McpReadyTabPage(this.page);
      await mcpReadyTabPage.waitForLoad();
      return mcpReadyTabPage;
    } catch (error) {
      await expect(this.errorMessage).toBeVisible();
      const errorMessage = (await this.errorMessage.textContent()) ?? '';
      throw new Error(`Failed to connect to a remote MCP server: ${errorMessage}`);
    }
  }
}
