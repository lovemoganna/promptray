# IndexedDB 存储迁移指南

## 📋 概述

本文档详细介绍从 localStorage 升级到 IndexedDB 的存储架构迁移过程。该迁移旨在解决 localStorage 的容量限制、性能问题和数据结构限制，为应用提供更强大的存储能力。

## 🎯 迁移目标

### 主要改进
- **容量升级**: 从 ~5-10MB 限制升级到数百MB
- **性能提升**: 异步操作，不阻塞主线程
- **数据结构**: 支持复杂对象、索引查询
- **并发安全**: 事务支持，避免数据竞争
- **可扩展性**: 支持数据库版本管理和迁移

### 兼容性保证
- ✅ 向下兼容：支持从 localStorage 自动迁移
- ✅ 无缝切换：应用运行时自动选择最佳存储方案
- ✅ 数据安全：多重备份和恢复机制
- ✅ 渐进升级：支持分阶段启用新功能

## 🏗️ 架构设计

### 数据库结构

```typescript
// IndexedDB Schema (v2)
interface IDBSchema {
  prompts: Prompt[];           // 主提示数据，支持索引
  categories: Category[];      // 分类数据
  themes: ThemeSetting[];      // 主题设置
  filters: FilterState[];      // 筛选器状态
  settings: KeyValuePair[];    // 通用设置，支持索引
  handles: FileHandle[];       // 文件系统句柄（继承v1）
}
```

### 存储策略

```typescript
enum StorageBackend {
  LOCAL_STORAGE = 'localStorage',  // 传统模式
  INDEXED_DB = 'indexedDB',        // 新架构
  HYBRID = 'hybrid'                // 混合模式（推荐）
}
```

## 📊 迁移路径

### 阶段1: 分析与设计 ✅ 已完成
- 分析当前 localStorage 使用情况
- 设计 IndexedDB 数据库架构
- 制定兼容性策略

### 阶段2: 核心实现 ✅ 已完成
- 实现 IndexedDB 存储服务
- 开发数据迁移机制
- 构建统一存储 API

### 阶段3: 集成与测试 🔄 进行中
- 集成到 React 应用
- 添加迁移管理界面
- 编写测试用例

### 阶段4: 验证与优化 📋 待开始
- 性能测试和优化
- 浏览器兼容性测试
- 生产环境部署

## 🔧 使用方法

### 自动迁移（推荐）

应用启动时会自动检测并执行迁移：

```typescript
// 在应用初始化时调用
import { initializeStorageMigration } from './services/storageService';

const migrationStatus = await initializeStorageMigration();
if (migrationStatus.success) {
  console.log('Migration completed:', migrationStatus);
}
```

### 手动迁移

通过命令面板访问存储迁移工具：
1. 按 `Ctrl+K` (Windows/Linux) 或 `Cmd+K` (Mac)
2. 输入 "Storage Migration" 或选择对应选项
3. 在弹出的界面中管理迁移过程

### 存储后端配置

```typescript
// 在 storageService.ts 中配置
const STORAGE_BACKEND: StorageBackend = StorageBackend.HYBRID;
const FEATURE_FLAGS = {
  useIndexedDBForPrompts: true,
  useIndexedDBForSettings: true,
  enableMigrationOnStartup: true,
  keepLocalStorageBackup: true
};
```

## 🔍 数据迁移详情

### 迁移映射表

| localStorage Key | IndexedDB Store | 说明 |
|------------------|-----------------|------|
| `prompts_data_v2` | `prompts` | 主提示数据，支持多索引 |
| `prompts_categories_v1` | `categories` | 自定义分类 |
| `prompts_theme_v1` | `settings[user_theme]` | 用户主题设置 |
| `prompts_filters_v1` | `settings[filter_state]` | 筛选器状态 |
| `prompt_audit_endpoint` | `settings[audit_endpoint]` | 审计端点配置 |

### 索引优化

```typescript
// 为常用查询创建索引
promptsStore.createIndex('category', 'category', { unique: false });
promptsStore.createIndex('isFavorite', 'isFavorite', { unique: false });
promptsStore.createIndex('createdAt', 'createdAt', { unique: false });
promptsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
```

## 🛡️ 安全与回滚

### 数据备份策略
1. **自动备份**: 迁移前自动备份 localStorage 数据
2. **双重存储**: 混合模式下同时维护两个存储
3. **导出功能**: 支持手动导出完整数据

### 回滚机制
```typescript
// 如果迁移失败，可以回滚
const rollbackToLocalStorage = async () => {
  // 切换回 localStorage 模式
  STORAGE_BACKEND = StorageBackend.LOCAL_STORAGE;
  // 重新加载应用
  window.location.reload();
};
```

### 故障恢复
- **数据校验**: 自动检测和修复损坏数据
- **版本兼容**: 支持不同版本数据格式
- **错误隔离**: 单个数据项错误不影响整体迁移

## 📈 性能优化

### 查询优化
- **索引使用**: 为常用查询字段创建索引
- **游标查询**: 支持大数据集分页查询
- **缓存策略**: 内存缓存频繁访问的数据

### 存储优化
- **数据压缩**: 自动压缩大对象
- **批量操作**: 支持批量读写操作
- **事务管理**: 优化事务大小和并发

## 🧪 测试策略

### 单元测试
```bash
npm test -- storageMigration.test.ts
```

### 集成测试
- 浏览器兼容性测试（Chrome, Firefox, Safari, Edge）
- 大数据量性能测试
- 并发操作测试

### 迁移测试场景
- ✅ 从空 localStorage 迁移
- ✅ 从有数据的 localStorage 迁移
- ✅ 增量迁移（只迁移新增数据）
- ✅ 故障恢复和回滚

## 🚀 部署计划

### 灰度发布
1. **开发环境**: 完全启用 IndexedDB
2. **测试环境**: 启用混合模式
3. **生产环境**: 灰度发布，逐步迁移用户

## 🔧 故障排除

### 常见问题

**Q: IndexedDB 没有数据，localStorage 有数据**
A: 自动迁移可能没有被触发。请按以下步骤解决：

1. **使用专用调试工具** (推荐):
   - 在浏览器中打开项目中的 `debug-migration.html` 文件
   - 点击 "运行完整诊断" 查看详细状态
   - 点击 "执行完整迁移" 直接修复问题

2. **启用自动迁移**:
   ```typescript
   // 在 services/storageService.ts 中
   const FEATURE_FLAGS = {
     enableMigrationOnStartup: true, // 确保为 true
     // ... 其他配置
   };
   ```

3. **手动触发迁移**:
   - 按 `Ctrl+K` (Windows/Linux) 或 `Cmd+K` (Mac) 打开命令面板
   - 输入 "Storage Migration" 选择存储迁移选项
   - 点击 "Force Migration (Debug)" 红色按钮

4. **浏览器控制台调试**:
   ```javascript
   // 在控制台中运行
   debugStorageMigration()
   ```

5. **检查迁移状态**:
   - 在存储迁移界面中点击 "Debug Storage Status" 查看当前状态
   - 检查浏览器控制台是否有迁移相关的日志信息

6. **强制刷新页面**:
   - 如果迁移完成，刷新页面让应用重新加载数据

**Q: 迁移过程中出现错误**
A: 检查浏览器控制台的错误信息：
- `QuotaExceededError`: IndexedDB 存储空间不足
- `InvalidStateError`: 数据库状态异常
- `TransactionInactiveError`: 事务已结束

**Q: 想要回滚到 localStorage**
A: 修改配置并重启应用：
```typescript
STORAGE_BACKEND = StorageBackend.LOCAL_STORAGE;
```

### 监控指标
- 迁移成功率
- 性能对比（响应时间、内存使用）
- 错误率和用户反馈

## 📚 API 参考

### 统一存储 API

```typescript
// 提示数据操作
getPromptsUnified(): Promise<Prompt[]>
savePromptsUnified(prompts: Prompt[]): Promise<void>
savePromptUnified(prompt: Prompt): Promise<void>
deletePromptUnified(promptId: string): Promise<void>

// 分类操作
getCustomCategoriesUnified(): Promise<string[]>
saveCustomCategoriesUnified(categories: string[]): Promise<void>

// 设置操作
getUserThemeUnified(): Promise<string>
saveUserThemeUnified(themeId: string): Promise<void>
getFilterStateUnified(): Promise<FilterState | null>
saveFilterStateUnified(filters: FilterState): Promise<void>
```

### 迁移管理 API

```typescript
// 迁移控制
initializeStorageMigration(): Promise<MigrationStatus>
migrateAllDataToIDB(): Promise<MigrationResult>

// 数据管理
exportAllData(): Promise<ExportData>
importData(data: ExportData): Promise<ImportResult>
clearAllData(): Promise<void>
```

## 🔧 故障排除

### 常见问题

**Q: 迁移过程中出现 "QuotaExceededError"**
A: IndexedDB 存储已满，清除不必要的应用数据或使用导出功能备份重要数据。

**Q: 某些数据没有迁移成功**
A: 检查浏览器控制台错误信息，可能需要手动修复数据格式。

**Q: 应用启动变慢**
A: 迁移过程可能耗时，可以暂时禁用自动迁移：
```typescript
FEATURE_FLAGS.enableMigrationOnStartup = false;
```

**Q: 想要回滚到 localStorage**
A: 修改配置并重启应用：
```typescript
STORAGE_BACKEND = StorageBackend.LOCAL_STORAGE;
```

### 调试工具

```typescript
// 检查迁移状态
const status = await getMigrationStatus();
console.log('Migration status:', status);

// 查看 IndexedDB 内容
// 在浏览器开发者工具中：
// Application → Storage → IndexedDB → PromptRayDB
```

## 📋 检查清单

### 迁移前检查
- [ ] 备份重要数据
- [ ] 检查浏览器兼容性
- [ ] 确认存储空间充足
- [ ] 准备回滚方案

### 迁移中监控
- [ ] 观察控制台错误信息
- [ ] 检查迁移进度
- [ ] 验证数据完整性
- [ ] 测试主要功能

### 迁移后验证
- [ ] 所有功能正常工作
- [ ] 性能提升明显
- [ ] 数据一致性验证
- [ ] 用户反馈收集

## 📞 支持与反馈

如果在迁移过程中遇到问题，请：

1. 查看浏览器控制台错误信息
2. 检查本文档的故障排除部分
3. 通过命令面板访问存储迁移工具
4. 导出诊断数据并寻求帮助

---

## 🔄 更新日志

### v2.0.0 (IndexedDB Migration)
- ✨ 完全重构存储架构，从 localStorage 升级到 IndexedDB
- 🚀 显著提升存储容量和性能
- 🔄 实现无缝数据迁移
- 🛡️ 增强数据安全性和可靠性
- 📱 改进用户体验和错误处理

### 兼容性说明
- 支持所有现代浏览器
- 需要 IndexedDB 支持
- 自动降级到 localStorage（如果需要）
