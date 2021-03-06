<template>
  <div>
    <div class="flex items-baseline justify-between">
      <h1 v-if="title" class="text-xl font-bold">{{ title }}</h1>
      <TButton v-if="add && can('add', collection)" @click="currentId = 'add'">
        {{ add }}
      </TButton>
    </div>

    <div v-if="!can('add', collection)">
      <slot name="auth" />
    </div>

    <slot name="header" />

    <div v-if="currentId === 'add'" class="mt-4 rounded bg-white mb-4 shadow">
      <TForm
        class="px-6 py-4"
        :fields="fields"
        show-cancel
        @save="createItem"
        @cancel="cancelItem"
      />
    </div>

    <div
      v-if="filters && filters.length > 1"
      class="mt-4 md:flex bg-orange-100 rounded shadow"
    >
      <button
        v-for="filter in filters"
        :key="filter.name"
        class="p-2 text-gray-700"
        :class="filter.name === activeFilter ? 'font-bold' : ''"
        @click="activeFilter = filter.name"
      >
        {{ filter.label }}
      </button>
    </div>

    <div v-if="!items.length">
      <slot name="empty" />
    </div>

    <div v-for="(item, itemId) in items" :key="item.id">
      <div v-if="currentId === itemId">
        <div
          v-if="itemLabel(item)"
          class="font-bold border-b mb-4 flex justify-between"
        >
          <div>
            {{ itemLabel(item) }}
          </div>
          <button
            class="rounded p-2 hover:text-primary"
            @click="cancelItem(item)"
          >
            <TIcon name="close" />
          </button>
        </div>

        <slot name="editor-header" :item="item" />

        <TForm
          v-model="items[itemId]"
          :fields="fields"
          show-cancel
          :show-remove="can('remove', collection, item)"
          class="rounded bg-white mb-4 shadow p-4"
          @save="saveItem"
          @cancel="cancelItem"
          @remove="removeItem"
        />
      </div>
      <template v-else>
        <div class="flex justify-end">
          <slot name="card-toolbar" :item="item" />

          <button
            v-if="fields.length && can('edit', collection, item)"
            class="rounded p-2 hover:text-primary"
            @click="currentId = itemId"
          >
            <TIcon name="edit" />
          </button>
          <button
            v-if="deleteItem"
            class="rounded p-2 hover:text-primary"
            @click="removeItem(item.id)"
          >
            Delete
          </button>
        </div>
        <slot :item="item">
          {{ itemLabel(item) }}
        </slot>
      </template>
    </div>
  </div>
</template>

<script>
import { computed, ref } from '@nuxtjs/composition-api'
import { sortBy } from '~/utils'
import useAuth from '~/use/auth'
import useDoc from '~/use/doc'
import useCollection from '~/use/collection'
import TIcon from '~/components/TIcon'
import TForm from '~/components/TForm'
import TButton from '~/components/TButton'

export default {
  components: {
    TIcon,
    TForm,
    TButton
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    add: {
      type: String,
      default: ''
    },
    collection: {
      type: String,
      default: ''
    },
    fields: {
      type: Array,
      default: () => []
    },
    filters: {
      type: Array,
      default: () => []
    },
    map: {
      type: [Function, Boolean],
      default: false
    },
    deleteItem: {
      type: Boolean,
      default: false
    },
    itemClass: {
      type: String,
      default: 'px-6 py-4 rounded bg-white mb-4 shadow'
    },
    itemLabel: {
      type: Function,
      default: (item) => {
        return item.name
      }
    }
  },
  data: () => ({
    currentId: false
  }),
  watch: {
    items: 'loadItems'
  },
  setup(props) {
    const { docs } = useCollection(props.collection)
    const { update, remove, create } = useDoc(props.collection)
    const { can } = useAuth()

    const activeFilter = ref(
      props.filters.find((filter) => !!filter.default)?.name
    )

    const items = computed(() => {
      if (!docs.value) {
        return []
      }

      let result = docs.value

      if (props.map) {
        result = result.map(props.map)
      }

      if (!activeFilter.value) {
        return result
      }

      const filterObject = props.filters.find(
        (filter) => filter.name === activeFilter.value
      )

      if (filterObject.map) {
        result = result.map(filterObject.map)
      }

      if (filterObject.filter) {
        result = result.filter(filterObject.filter)
      }

      if (filterObject.sort) {
        result = result.sort(sortBy(filterObject.sort))
      }

      return result
    })

    return {
      can,
      update,
      create,
      remove,
      items,
      activeFilter
    }
  },
  methods: {
    loadItems() {
      this.$emit('loadItems', this.items)
    },
    cancelItem() {
      this.currentId = false
    },
    async createItem(data) {
      this.cancelItem()
      await this.create(data)
    },
    async saveItem(data) {
      this.cancelItem()
      await this.update(data.id, data)
    },
    async removeItem(id) {
      this.cancelItem()
      await this.remove(id)
    }
  }
}
</script>
